import React from "react";
import Helmet from "react-helmet";
import { Link, NavLink } from 'react-router-dom';
import { Header, NavBar, Footer } from "@civicactions/data-catalog-components";
import config from "../../assets/config.json";
import links from "../../assets/menu.json";
import logo from "../../theme/images/logo.png";
import oneBlueBlue from "../../theme/images/one-blue-blue.png";
import euNotice from "../../theme/images/eu-notice.png";

const Layout = ({
  children,
  title,
  description
}) => {
  return (
    <div className="App">
      <Helmet
        title={`${title} - One Blue`}
        description={description}
        generator="ONE-BLUE (https://one-blue.eu)"
        defer={false}
        htmlAttributes={{
          "lang": "en"
        }}
      />
      <div class="site-header">
      <div class="container">
      <div class="dc-header" style={{maxWidth: "220px"}}>
        <div class="container">
          <div class="branding"><a class="dc-logo" href="/"><img src={logo} alt="One Blue logo"/></a>
          <div class="dc-site-name"><a href="/">{config.site}</a>
          <div class="dc-slogan">{config.slogan}</div>
          </div>
          </div>
          
          </div>
      </div>
      
      <NavBar
        navItems={links.main.map(item => (
          <NavLink to={item.url}>
            {item.label}
          </NavLink>
        ))}
        customClasses={config.container}
      />
      </div>
      </div>
      <main>
        {children}
      </main>
      <div class="dc-footer">
        <div class="container page-footer">
          <div class="branding">
            <p><img src={oneBlueBlue}/><br/></p>
          <p>
          <div class="social">
          <a href="https://one-blue.eu"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></a>
          <a href="https://www.linkedin.com/company/102094360/admin/feed/posts/?feedType=following"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg></a>   
          <a href="https://twitter.com/one_blue_eu"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-twitter"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg></a>
          <a href="https://www.instagram.com/oneblue.eu/"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-instagram"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></a>
          </div>
          </p>
          <img src={euNotice}/></div><br/>
          
          <div class="dc-menu navigation-menu " aria-label="leftnav" id="leftnav">
            <p><b>Learn more:</b></p>
            <ul><li><a class="dc-menu-item" href="/" target="_blank">ONE-BLUE Data management Plan</a></li><li><a class="dc-menu-item" href="/">ONE-BLUE Data Dictionary</a></li></ul>
          </div>
          <div class="dc-menu navigation-menu " aria-label="rightnav" id="rightnav"><ul></ul></div></div></div>
    </div>
  );
};

export default Layout;
