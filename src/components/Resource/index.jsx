import React from "react";
import { Resource, FileDownload } from "@civicactions/data-catalog-components";
import { getResourceFormat } from "./summary";

const ResourceTemplate = ({ resource }) => {
  const format = getResourceFormat(resource);
  const downloadURL = resource.data?.downloadURL || "";
  const accessURL = resource.data?.accessURL || downloadURL;
  return (
    <div id={`resource_${resource.identifier}`}>
      <FileDownload title={resource.data?.title} format={format} downloadURL={downloadURL || accessURL} />
      {format === "csv" && (
        <Resource
          apiURL={import.meta.env.VITE_REACT_APP_ROOT_URL}
          id={resource.identifier}
          resource={resource}
          showDBColumnNames={true}
          format={format}
          downloadURL={downloadURL}
          accessURL={accessURL}
        />
      )}
    </div>
  );
};

export default ResourceTemplate;
