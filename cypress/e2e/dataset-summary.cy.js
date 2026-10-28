context('Sampling campaign summaries', () => {
  const samples = [
    { sample_tag: 'A', date_of_sampling_start: '2025-07-25', latitude: '41', longitude: '15' },
    { sample_tag: 'B', date_of_sampling_start: '2025-07-25', latitude: '41.000', longitude: '15' },
    { sample_tag: 'C', date_of_sampling_start: '2025-07-26', latitude: '42', longitude: '15' },
  ];
  const results = [
    { sample_tag: 'A', susdat_id: 'NS1', norman_substance_name: 'Caffeine', concentration: '1.250000000', concentration_units: 'ng/L', anal_method_serial_no: '1', detection_characterisation: 'detected quantitatively' },
    { sample_tag: 'A', susdat_id: 'NS1', norman_substance_name: 'Caffeine', concentration: '2.5', concentration_units: 'ng/L', anal_method_serial_no: '2', detection_characterisation: 'detected quantitatively' },
    { sample_tag: 'B', susdat_id: 'NS1', detection_characterisation: 'not detected' },
    { sample_tag: 'C', susdat_id: 'NS2', concentration: '<LOD', concentration_units: 'ng/L', limit_of_detection: '0.010000', limit_of_quantification: '0.050000', detection_characterisation: 'detected qualitatively' },
    { sample_tag: 'C', susdat_id: 'NS2', concentration: '<LOQ', concentration_units: 'ug/L', limit_of_detection: '0.020000', limit_of_quantification: '0.100000', detection_characterisation: 'detected qualitatively' },
  ];
  const metadata = campaign => ({
    identifier: 'summary-test',
    title: 'Summary test dataset',
    theme: campaign ? [{ identifier: 'campaign', data: 'Sampling Campaign' }] : [],
    distribution: [
      ['samples', 'sample'], ['results', 'analytical_results'],
      ['chemicals', 'chemical_compounds'], ['methods', 'analytical_methods'],
    ].map(([identifier, title]) => ({
      identifier,
      data: { title: `${title}_2025-12-22_uuid.csv`, format: 'csv', downloadURL: `https://example.test/${title}.csv` },
    })),
  });

  beforeEach(() => {
    cy.intercept('**/metastore/schemas/dataset/items/summary-test?*', metadata(true));
    cy.intercept('**/datastore/query/*?*', request => {
      const id = new URL(request.url).pathname.split('/').pop();
      const rows = id === 'samples' ? samples : id === 'results' ? results : id === 'methods'
        ? [{ anal_method_serial_no: '1' }, { anal_method_serial_no: '1' }, { anal_method_serial_no: '2' }]
        : [{ susdat_id: 'NS1' }, { susdat_id: 'NS2' }];
      request.reply({
        count: rows.length, results: rows,
        schema: { [id]: { fields: Object.fromEntries(Object.keys(rows[0]).map(key => [key, { type: 'text' }])) } },
      });
    });
  });

  it('keeps the overview visible on both tabs and orders four compact cards', () => {
    cy.visit('/dataset/summary-test');
    cy.get('.campaign-overview').should('be.visible').within(() => {
      cy.get('.ant-statistic-content-value').should('have.length', 3).then(values => {
        expect([...values].map(value => value.textContent)).to.deep.equal(['2', '2', '5']);
      });
    });
    cy.findByRole('tab', { name: 'Data', exact: true }).click();
    cy.get('.campaign-overview').should('be.visible');
    cy.get('.campaign-resource-card h2').then(headings => {
      expect([...headings].map(heading => heading.textContent)).to.deep.equal(['Samples', 'Chemical compounds', 'Analytical methods', 'Analytical results']);
    });
    cy.findAllByRole('button', { name: 'Explore', exact: true }).should('have.length', 4);
    cy.findAllByRole('link', { name: 'Download', exact: true }).should('have.length', 4);
    cy.get('.ant-modal').should('not.exist');
  });

  it('formats the concentration matrix without method labels, redundant zeros or units on limits', () => {
    cy.visit('/dataset/summary-test');
    cy.findByRole('tab', { name: 'Data', exact: true }).click();
    cy.get('.campaign-resource-card').last().findByRole('button', { name: 'Explore', exact: true }).click();
    cy.findByRole('dialog').within(() => {
      cy.contains('th', 'norman_substance_name').should('be.visible');
      cy.contains('th', 'A').should('be.visible');
      cy.contains('Caffeine').should('be.visible');
      cy.contains('1.25 ng/L').should('be.visible');
      cy.contains('2.5 ng/L').should('be.visible');
      cy.contains('Method:').should('not.exist');
      cy.contains('1.250000000').should('not.exist');
      cy.contains('<LOD').should('have.text', '<LOD');
      cy.contains('<LOQ').should('have.text', '<LOQ');
      cy.get('.ant-table-tbody tr.ant-table-row').first().find('td').eq(2).should('have.text', '-');
    });
  });

  it('uses a single dash for unavailable concentrations and preserves valid values in mixed cells', () => {
    const concentrations = ['NS', 'Concentration unavailable', 'N/A', '', null, '   '];
    const rows = concentrations.map((concentration, index) => ({
      sample_tag: `S${index}`,
      susdat_id: 'NS1',
      norman_substance_name: 'Caffeine',
      concentration,
      concentration_units: 'ng/L',
      detection_characterisation: 'detected quantitatively',
    }));
    rows.push({ ...rows[0], concentration: '0.00000' }, { ...rows[1], concentration: 'N/A' });
    cy.intercept('**/datastore/query/results?*', {
      count: rows.length, results: rows,
      schema: { results: { fields: Object.fromEntries(Object.keys(rows[0]).map(key => [key, { type: 'text' }])) } },
    });
    cy.visit('/dataset/summary-test');
    cy.findByRole('tab', { name: 'Data', exact: true }).click();
    cy.get('.campaign-resource-card').last().findByRole('button', { name: 'Explore', exact: true }).click();
    cy.findByRole('dialog').within(() => {
      cy.get('.ant-table-tbody tr.ant-table-row').first().find('td').then(cells => {
        expect([...cells].slice(1).map(cell => cell.textContent)).to.deep.equal(['0 ng/L', '-', '-', '-', '-', '-']);
      });
    });
  });

  it('shows row-specific CSV limits on hover or keyboard focus without changing cell labels', () => {
    cy.visit('/dataset/summary-test');
    cy.findByRole('tab', { name: 'Data', exact: true }).click();
    cy.get('.campaign-resource-card').last().findByRole('button', { name: 'Explore', exact: true }).click();
    cy.findByRole('dialog').contains('span', /^<LOD$/).trigger('mouseover');
    cy.findByRole('tooltip', { name: 'Limit of detection: 0.01 ng/L' }).should('be.visible');
    cy.findByRole('dialog').contains('span', /^<LOD$/).should('have.text', '<LOD').trigger('mouseout');
    cy.findByRole('dialog').contains('span', /^<LOQ$/).focus();
    cy.findByRole('tooltip', { name: 'Limit of quantification: 0.1 ug/L' }).should('be.visible');
    cy.findByRole('dialog').contains('span', /^<LOQ$/).should('have.text', '<LOQ');
  });

  it('filters substances by partial name or ID, handles no matches, and resets the table', () => {
    cy.visit('/dataset/summary-test');
    cy.findByRole('tab', { name: 'Data', exact: true }).click();
    cy.get('.campaign-resource-card').last().findByRole('button', { name: 'Explore', exact: true }).click();
    const search = query => {
      cy.findByRole('dialog').find('thead .ant-table-filter-trigger').first().click();
      cy.findByRole('searchbox', { name: 'Search substances' }).clear().type(query);
      cy.get('.ant-table-filter-dropdown').findByRole('button', { name: 'Search', exact: true }).click();
    };
    search(' cAfFe ');
    cy.findByRole('dialog').find('.ant-table-tbody tr.ant-table-row').should('have.length', 1).and('contain', 'Caffeine');
    search('ns2');
    cy.findByRole('dialog').find('.ant-table-tbody tr.ant-table-row').should('have.length', 1).and('contain', 'NS2');
    search('no-such-substance');
    cy.findByRole('dialog').find('.ant-table-tbody tr.ant-table-row').should('not.exist');
    cy.findByRole('dialog').find('thead .ant-table-filter-trigger').first().click();
    cy.get('.ant-table-filter-dropdown').findByRole('button', { name: 'Reset', exact: true }).click();
    cy.findByRole('dialog').find('.ant-table-tbody tr.ant-table-row').should('have.length', 2);
  });

  it('retains source column names and formats numeric values in record tables', () => {
    cy.visit('/dataset/summary-test');
    cy.findByRole('tab', { name: 'Data', exact: true }).click();
    cy.get('.campaign-resource-card').first().findByRole('button', { name: 'Explore', exact: true }).click();
    cy.findByRole('dialog').within(() => {
      cy.contains('th', 'sample_tag').should('be.visible');
      cy.contains('th', 'date_of_sampling_start').should('be.visible');
      cy.contains('td', '41.000').should('not.exist');
      cy.contains('td', '41').should('have.text', '41');
    });
  });

  it('uses the site font, white overview header text and colored Lucide actions', () => {
    cy.visit('/dataset/summary-test');
    cy.get('.campaign-overview .ant-card-head').should('have.css', 'color', 'rgb(255, 255, 255)');
    cy.findByRole('tab', { name: 'Data', exact: true }).click();
    cy.get('body').invoke('css', 'font-family').then(font => {
      cy.get('.campaign-overview .ant-card-head').should('have.css', 'font-family', font);
      cy.get('.campaign-resource-card .ant-statistic').first().should('have.css', 'font-family', font);
      cy.get('.campaign-resource-card').first().findByRole('button', { name: 'Explore', exact: true }).click();
      cy.findByRole('dialog').find('.ant-table').should('have.css', 'font-family', font);
      cy.findByRole('dialog').findByRole('button', { name: 'Close', exact: true }).click();
    });
    cy.get('.campaign-explore').first().should('have.css', 'background-color', 'rgb(255, 214, 102)').find('.lucide-compass').should('exist');
    cy.findAllByRole('link', { name: 'Download', exact: true }).first()
      .should('have.css', 'background-color', 'rgb(42, 108, 163)').find('.lucide-download').should('exist');
  });

  it('uses the overview spinner while dataset metadata loads', () => {
    cy.intercept('**/metastore/schemas/dataset/items/summary-test?*', { delay: 1000, body: metadata(true) });
    cy.visit('/dataset/summary-test');
    cy.findByRole('status', { name: 'Loading dataset' }).find('.ant-spin').should('be.visible');
    cy.get('.spinner-border').should('not.exist');
    cy.findByRole('tab', { name: 'Metadata', exact: true }).should('be.visible');
  });

  it('preserves ordinary resources for datasets without the campaign theme', () => {
    cy.intercept('**/metastore/schemas/dataset/items/summary-test?*', metadata(false));
    cy.visit('/dataset/summary-test');
    cy.findByRole('tab', { name: 'Data', exact: true }).click();
    cy.get('.campaign-overview, .campaign-resource-grid').should('not.exist');
    cy.get('#resource_samples .dc-resource a').first().should('have.text', 'sample_2025-12-22_uuid.csv');
    cy.get('#resource_samples .dc-datatable').should('be.visible');
  });

  it('keeps downloads available on summary errors and supports retry', () => {
    cy.intercept({ url: '**/datastore/query/results?*', times: 1 }, { statusCode: 503, body: {} });
    cy.visit('/dataset/summary-test');
    cy.findByRole('tab', { name: 'Data', exact: true }).click();
    cy.get('.campaign-resource-card').last().within(() => {
      cy.findByRole('alert').should('be.visible');
      cy.findByRole('link', { name: 'Download', exact: true }).should('be.visible');
      cy.findByRole('button', { name: 'Explore', exact: true }).should('be.disabled');
      cy.findByRole('button', { name: 'Retry', exact: true }).click();
      cy.findByRole('button', { name: 'Explore', exact: true }).should('be.enabled');
      cy.findByRole('alert').should('not.exist');
    });
  });
});
