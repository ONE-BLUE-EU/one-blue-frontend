# CECsMarineDB GUI

The CECsMarineDB GUI is built with [Vite](https://vitejs.dev/).

This is a REACT frontend designed to utilize the latest stable version of [DKAN 2.x](https://github.com/GetDKAN/dkan) as a backend.

This application uses the [data-catalog-components](https://github.com/GetDKAN/data-catalog-components) library.

## Dataset Data tab

Only datasets with the **Sampling campaign** theme (case-insensitive) use the
Ant Design campaign interface. Other datasets retain their original file titles,
download links and catalog table previews.

The campaign sidebar shows merged samples (unique sampling calendar dates in
`date_of_sampling_start` plus latitude/longitude), unique compounds from the
chemical-compounds files, and total analytical-results rows. The overview loads
on Metadata and stays visible on Data.

Four cards appear in order on desktop, wrapping on smaller screens:

- **Samples:** total rows, stations (distinct latitude/longitude), sampling date range.
- **Chemical compounds:** distinct `susdat_id` values, falling back to substance names.
- **Analytical methods:** distinct `anal_method_serial_no` values.
- **Analytical results:** total rows, analyzed samples matched by sample tag/code to
  Samples and merged by date/coordinates, and distinct detected compounds.

Each card has matching **Explore** and **Download** controls with Lucide icons
(yellow/orange Explore, blue Download). Campaign components inherit the site's
fonts, and the overview header uses the navigation bar's blue with white text.
The dataset page uses the same Ant Design spinner as the overview while loading.
Exploration opens an
Ant Design table in a modal. Analytical results are pivoted into compound rows and
sample-tag columns. Cells retain every detected concentration and its original units;
method IDs are not displayed, but results from different methods are never averaged
or silently overwritten. `<LOD` and `<LOQ` labels are shown without units.
Hover or focus these labels to see the same result row's `limit_of_detection` or
`limit_of_quantification`, respectively, including concentration units. Missing
limits are explicitly shown as **Unavailable** in the tooltip.
Unavailable concentrations (`NS`, `N/A`, blank values, or "Concentration unavailable")
and missing/non-detected results display a single dash, without units. If a cell
also has valid concentrations, only those valid values are shown.
Use the substance column's filter to search by name or ID (case-insensitive,
partial matches); **Reset** clears the search.
Numeric table values omit redundant trailing zeros, and column labels retain
their source field names, including underscores.
Detections are rows whose `detection_characterisation` starts with "detected".
Missing and non-detected concentrations are never displayed as zero.
Results missing a compound identity or sample tag are reported above the table.

Summaries load all datastore pages (500 rows per request), not just the visible
table page. Missing files, required values or ambiguous sample matches are shown
as **Unavailable**, not a partial count. Request errors include a retry control,
and downloads remain accessible. Multiple CSVs of one type share a card and each
has its own download button.

## Requirements
- Node ^16

## Set Up
Assuming that the CECsMarineDB Database Management System is running:

1) Clone this repository in your **docroot** ``git clone https://github.com/ONE-BLUE-EU/one-blue-frontend frontend``.
2) Install the dependencies with [npm](https://www.npmjs.com/):
   2.1) ``cd frontend``
   2.2) ``npm install`` or ``yarn install``
3) Run the server: ``npm start`` or ``yarn start``
   3.1) Your site is now running at ``http://localhost:3000``
4) Build the public files ``npm run build``

## Set up of an independent front-end (with no backend)

1) Run `npm install`
2) Run `npm run start` to view the app in development mode at `localhost:3000`.

## Structure of the app

This is meant to be a blueprint for your frontend, from which you can make minor color and logo changes or major component or page layout customizations.

    ├── cypress           # Integration tests
    ├── build             # The output of the build process
    ├── public            # Base files that the app builds with
    ├── src               # This directory will contain all of the source code
    |   ├── assets        # Place to store images and content/config files
    |   ├── components    # Configure your page structure with the layout component
    │   ├── pages         # Components in this directory become pages automatically with paths based on their file name
    │   ├── services      # Provides the connections to the backend api
    |   └── templates     # Ideas for how to assemble components to display the data
    │   └── theme         # Add custom fonts, colors, and css here
    ├── package.json      # App dependencies

## Basic Customizations

- Edit the `src/assets/config.json` file to change the site title, slogan, logo, and container class.
- Edit the `src/theme/styles/_variables.scss` file to change the colors and fonts of your site.
- Add custom .scss files to `src/theme/styles/` to override the default css classes with your new color variables and other changes.
- Import your .scss files to `src/theme/styles/index.scss`

## Available Scripts

In the project directory, you can run:

### `npm run start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm run test`

Launches [vitest](https://vitest.dev/). Run the dataset-summary tests once with
`npm test -- --run src/components/Resource/summary.test.js`.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />

### `npm run preview`

Runs the React site in production mode, independently from drupal.


## Running Cypress Tests

To run Cypress tests on a local React-only install of this repo, ensure the app is running at `localhost:3000`. In a separate terminal, use `npx cypress run --config baseUrl="http://localhost:3000"`.