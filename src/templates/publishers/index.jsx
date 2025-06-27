import React from 'react';
import { PublisherList } from "@civicactions/data-catalog-components";
import config from "../../assets/config";
import Layout from '../../components/Layout';
import orgs from "../../assets/publishers";

const Publishers = () => {
  return (
    <Layout title="Dataset Publishers">
    <div className={`dc-page ${config.container}`}>
      <h1>Dataset Contributors</h1>
      <div>
        <p>
          The organisations below have gathered, consolidated and contributed to the ONE-BLUE CECsMarineDB. Click on each organisation to view the specific (public) datasets they have uploaded.
        </p>

        <PublisherList items = {orgs} />

      </div>
    </div>
    </Layout>
  );
}

export default Publishers;
