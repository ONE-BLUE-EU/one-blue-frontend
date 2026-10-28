import { useQueries } from "@tanstack/react-query";
import { campaignResourceNames, fetchResourceRows, getResourceFormat, getResourceName } from "./summary";

export default function useCampaignData(resources, enabled) {
  const apiURL = import.meta.env.VITE_REACT_APP_ROOT_URL;
  const files = enabled ? resources.filter(resource =>
    getResourceFormat(resource) === "csv" && campaignResourceNames.includes(getResourceName(resource))
  ) : [];
  const queries = useQueries({
    queries: files.map(resource => ({
      queryKey: ["resource-summary", apiURL, resource.identifier, resource.data.downloadURL],
      queryFn: ({ signal }) => fetchResourceRows(apiURL, resource.identifier, signal),
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  });
  return campaignResourceNames.map(name => {
    const matching = files.map((resource, index) => ({ resource, query: queries[index] }))
      .filter(file => getResourceName(file.resource) === name);
    return {
      name,
      files: matching.map(file => file.resource),
      rows: matching.length && matching.every(file => file.query.isSuccess) ? matching.flatMap(file => file.query.data) : null,
      loading: matching.some(file => file.query.isPending),
      error: matching.find(file => file.query.isError)?.query.error,
      retry: () => matching.filter(file => file.query.isError).forEach(file => file.query.refetch()),
    };
  });
}
