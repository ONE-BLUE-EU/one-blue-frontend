import React, { useMemo, useState } from "react";
import { Alert, Button, Card, Empty, Input, Modal, Space, Spin, Statistic, Table, Tooltip, Typography } from "antd";
import { Compass, Download } from "lucide-react";
import ResourceTemplate from "./index";
import { buildConcentrationMatrix, campaignStatistics, concentrationLimitTooltip, countCompounds, formatConcentration, formatTableValue, getResourceFormat, getResourceName, summarizeSamples } from "./summary";
import "./resource.scss";

const displayCount = count => count === null || count === undefined ? "Unavailable" : count;

const LoadError = ({ group }) => group.error && (
  <Alert
    type="error"
    showIcon
    message={`Unable to load ${group.name.toLowerCase()}`}
    description={group.error.message}
    action={<Button size="small" onClick={group.retry}>Retry</Button>}
  />
);

export const CampaignOverview = ({ groups }) => {
  const samples = groups[0];
  const compounds = groups[1];
  const results = groups[3];
  const statistics = [
    { label: "Samples", count: samples.rows ? summarizeSamples(samples.rows)[1].count : null, group: samples },
    { label: "Compounds", count: compounds.rows ? countCompounds(compounds.rows) : null, group: compounds },
    { label: "Analytical results", count: results.rows?.length, group: results },
  ];
  return (
    <Card title="Campaign overview" size="small" className="campaign-overview">
      <Space direction="vertical" size="middle">
        {statistics.map(statistic => (
          <div key={statistic.label}>
            {statistic.group.loading
              ? <Spin size="small" aria-label={`Loading ${statistic.label.toLowerCase()}`} />
              : <Statistic title={statistic.label} value={displayCount(statistic.count)} />}
            <LoadError group={statistic.group} />
          </div>
        ))}
      </Space>
    </Card>
  );
};

const ResultsTable = ({ rows }) => {
  const matrix = useMemo(() => buildConcentrationMatrix(rows), [rows]);
  const columns = [
    {
      title: "norman_substance_name",
      dataIndex: "compound",
      key: "compound",
      fixed: "left",
      width: 220,
      sorter: (a, b) => a.compound.localeCompare(b.compound),
      filterDropdown: ({ selectedKeys, setSelectedKeys, confirm, clearFilters }) => (
        <Space direction="vertical" style={{ padding: 12 }} onKeyDown={event => event.stopPropagation()}>
          <Input.Search
            aria-label="Search substances"
            placeholder="Substance name or ID"
            value={selectedKeys[0] || ""}
            onChange={event => setSelectedKeys(event.target.value ? [event.target.value] : [])}
            onSearch={() => confirm()}
            enterButton="Search"
            allowClear
          />
          <Button size="small" onClick={() => { clearFilters(); confirm(); }}>Reset</Button>
        </Space>
      ),
      onFilter: (query, row) => `${row.compound} ${row.identifier || ""}`.toLowerCase().includes(String(query).trim().toLowerCase()),
      render: (name, row) => <><Typography.Text strong>{name}</Typography.Text><br /><Typography.Text type="secondary">{row.identifier}</Typography.Text></>,
    },
    ...matrix.tags.map(tag => ({
      title: tag,
      key: tag,
      width: 200,
      render: (_, row) => {
        const values = (row.cells.get(tag) || []).map(entry => ({
          concentration: formatConcentration(entry),
          tooltip: concentrationLimitTooltip(entry),
        })).filter(entry => entry.concentration !== "-");
        if (!values.length) return <Typography.Text type="secondary">-</Typography.Text>;
        return <Space direction="vertical" size="small">{values.map(({ concentration, tooltip }, index) => (
          <div key={index}>
            {tooltip
              ? <Tooltip title={tooltip} trigger={["hover", "focus"]}><span tabIndex={0}>{concentration}</span></Tooltip>
              : concentration}
          </div>
        ))}</Space>;
      },
    })),
  ];
  return (
    <>
      <Typography.Paragraph type="secondary">
        Only detected concentrations are shown. Multiple results are listed separately.
        A dash indicates a missing or unavailable detected concentration, not zero.
      </Typography.Paragraph>
      {matrix.incomplete > 0 && <Alert type="warning" showIcon message={`${matrix.incomplete} results could not be placed because a compound identifier or sample tag is missing.`} />}
      <Table
        size="small"
        bordered
        columns={columns}
        dataSource={matrix.rows}
        pagination={{ defaultPageSize: 20, showSizeChanger: true }}
        scroll={{ x: 220 + matrix.tags.length * 200, y: 500 }}
      />
    </>
  );
};

const RecordsTable = ({ rows }) => {
  const columns = useMemo(() => [...new Set(rows.flatMap(row => Object.keys(row)))].map(key => ({
    title: key,
    dataIndex: ["record", key],
    key,
    width: 180,
    render: formatTableValue,
  })), [rows]);
  const records = useMemo(() => rows.map((record, key) => ({ key, record })), [rows]);
  return <Table size="small" bordered columns={columns} dataSource={records} pagination={{ defaultPageSize: 20, showSizeChanger: true }} scroll={{ x: columns.length * 180, y: 500 }} />;
};

const DataResources = ({ resources, groups }) => {
  const [exploring, setExploring] = useState(null);
  const selected = groups.find(group => group.name === exploring);
  const samples = groups[0];
  const otherResources = resources.filter(resource =>
    getResourceFormat(resource) !== "csv" || !groups.some(group => group.name === getResourceName(resource))
  );
  return (
    <>
      <div className="campaign-resource-grid">
        {groups.map(group => {
          const statistics = campaignStatistics(group.name, group.rows, samples.rows);
          return (
            <Card key={group.name} title={<h2>{group.name}</h2>} size="small" className="campaign-resource-card">
              <div className="campaign-card-summary">
                {group.loading ? <Spin size="small" aria-label={`Loading ${group.name}`} /> : (
                  group.rows ? statistics.map(statistic => (
                    <Statistic key={statistic.label} title={statistic.label} value={displayCount(statistic.count)} />
                  )) : <Typography.Text type="secondary">{group.files.length ? "Summary unavailable" : "File not available"}</Typography.Text>
                )}
                <LoadError group={group} />
                {group.name === "Analytical results" && <LoadError group={samples} />}
                {statistics.some(statistic => statistic.count === null) && <Typography.Text style={{ fontSize: "10px" }} type="secondary">Some counts are unavailable because required values or sample matches are missing.</Typography.Text>}
              </div>
              <Space direction="vertical" className="campaign-card-actions">
                <Button block className="campaign-explore" icon={<Compass size={16} aria-hidden="true" />} disabled={!group.rows} onClick={() => setExploring(group.name)}>Explore</Button>
                {group.files.length ? group.files.map((file, index) => (
                  <Button block type="primary" icon={<Download size={16} aria-hidden="true" />} key={file.identifier} href={file.data.downloadURL || file.data.accessURL} disabled={!file.data.downloadURL && !file.data.accessURL}>
                    {group.files.length === 1 ? "Download" : `Download CSV ${index + 1}`}
                  </Button>
                )) : <Button block type="primary" icon={<Download size={16} aria-hidden="true" />} disabled>Download</Button>}
              </Space>
            </Card>
          );
        })}
      </div>
      <Modal title={exploring} open={Boolean(selected)} onCancel={() => setExploring(null)} footer={null} width="95vw" destroyOnHidden>
        {selected?.rows ? selected.name === "Analytical results" ? <ResultsTable rows={selected.rows} /> : <RecordsTable rows={selected.rows} /> : <Empty />}
      </Modal>
      {otherResources.map(resource => <ResourceTemplate key={resource.identifier} resource={resource} />)}
    </>
  );
};

export default DataResources;
