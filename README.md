# CECsMarineDB GUI

The CECsMarineDB GUI is built with [Vite](https://vitejs.dev/).

This is a REACT frontend designed to utilize the latest stable version of [DKAN 2.x](https://github.com/GetDKAN/dkan) as a backend.

This application uses the [data-catalog-components](https://github.com/GetDKAN/data-catalog-components) library.

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

Launches [vitest](https://vitest.dev/) and runs any found test files. The demo app does not currently contain any Vitest / Jest tests.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />

### `npm run preview`

Runs the React site in production mode, independently from drupal.


## Running Cypress Tests

To run Cypress tests on a local React-only install of this repo, ensure the app is running at `localhost:3000`. In a separate terminal, use `npx cypress run --config baseUrl="http://localhost:3000"`.