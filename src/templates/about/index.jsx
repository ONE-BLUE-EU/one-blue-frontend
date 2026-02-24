import React, { useState } from "react";
import { Announcement } from "@civicactions/data-catalog-components";
import Layout from '../../components/Layout';
import config from "../../assets/config";
import { version, dependencies } from '../../../package.json';
import { Card, CardBody, CardTitle, Badge, Row, Col } from 'reactstrap';

const About = () => {
    const projectHighlights = [
        { title: "EU Horizon 2020", description: "Grant Agreement No 101037259", icon: "🇪🇺" },
        { title: "Duration", description: "3.5 years (2023-2027)", icon: "⏱️" },
        { title: "Case Studies", description: "3 different marine ecosystems", icon: "🌊" }
    ];

    return (
        <Layout title="About">
            <div className={`dc-page ${config.container}`}>
                {/* Hero Section */}
                <div className="hero-section mb-5 p-4" style={{ 
                    background: 'linear-gradient(rgb(42, 108, 163), rgb(14, 6, 6))', 
                    color: '#fff',
                    textAlign: 'center'
                }}>
                    <h1 className="display-4 mb-3 text-white">About the CECsMarineDB</h1>
                    <p className="lead">Assessing the levels and impact of contaminants of emerging concern on BLUE health and biodiversity modulated by climate change drivers.</p>
                </div>

                <div className="dc-page-content">
                    {/* Project Highlights Cards */}
                    <Row className="mb-5">
                        {projectHighlights.map((highlight, index) => (
                            <Col md={4} sm={6} key={index} className="mb-3">
                                <Card className="h-100 shadow-sm border-0" style={{ 
                                    transition: 'transform 0.2s',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0px)'}>
                                    <CardBody className="text-center">
                                        <div style={{ fontSize: '2rem' }}>{highlight.icon}</div>
                                        <CardTitle tag="h5" className="mt-2">{highlight.title}</CardTitle>
                                        <p className="text-muted small">{highlight.description}</p>
                                    </CardBody>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    <Row>
                        <Col lg={12} md={12}>
                            <Card className="mb-4 border-0 shadow-sm">
                                <CardBody>
                                    <h3 className="mb-4">🌊 Project Overview</h3>
                                    <p className="mb-4">
                                        The <strong>ONE-BLUE project</strong> (
                                        <a href="https://one-blue.eu/" target="_blank" rel="noopener noreferrer" 
                                           className="text-decoration-none">
                                            https://one-blue.eu/ ↗
                                        </a>) is funded by the European Union's Horizon Europe research and innovation programme under grant agreement No 101037259. The project started on 1st January 2023 and has a 3.5-year duration.
                                    </p>
                                    
                                    <div className="alert alert-info border-0" style={{ backgroundColor: '#e7f3ff' }}>
                                        <strong>🎯 Key Objectives:</strong> 
                                        <ul>
                                            <li>Improve the current knowledge of the concentrations, profiles, fate, behaviour, and effects of CECs, in the different marine compartments and ecosystems through three case studies (the Atlantic Ocean, the Arctic Ocean, and the Mediterranean Sea), and develop safety guidelines and protocols for future CECs monitoring in aquatic environments.</li>
                                            <li>Provide an advanced understanding of possible interaction between CC and CECs in marine ecosystems via studies under controlled conditions in marine mesocosms.</li>
                                            <li>Develop a database (DB), the CECsMarineDB, following FAIR principles (Findability, Accessibility, Interoperability, and Reusability), with a database management system (DBMS) to collect the data generated in ONE-BLUE, and capitalise on data from other projects and existing DBs. A graphical user interface (GUI) will be developed and used for data exploration and demonstration of the fate and behaviour of CECs in a changing environment.</li>
                                            <li>Provide new solutions in support of the implementation of relevant EU policies: (i) a series of new approach methodologies (NAMs) to improve the ecotoxicity assessment of CECs in marine ecosystems; (ii) a tier effect-based approach with effect-directed analysis (EDA) combining toxicological assessment and chemical analysis; (iii) an advanced ultrasonic system for sampling and enrichment of micro/nanoplastics from seawater; (iv) a remote autonomous sensor to assess CECs in marine waters in quasi-real-time; a decision support system (DSS) based on machine learning and deep learning strategies to assess and forecast the combined effects of CC and CECs in marine ecosystems. </li>
                                            <li>Disseminate the project results and establish the exploitation plan for the developed technologies.</li>
                                        </ul>
                                    </div>
                                </CardBody>
                            </Card>

                            <Card className="mb-4 border-0 shadow-sm">
                                <CardBody>
                                    <h3 className="mb-4">🔬 Research Approach</h3>
                                    <p>
                                        Data are obtained from <Badge color="primary" className="me-2">3 case studies</Badge> 
                                        including different ecosystems and compartments, including results from:
                                    </p>
                                    <ul className="list-unstyled">
                                        <li className="mb-2">✓ Chemical analysis</li>
                                        <li className="mb-2">✓ Microbial biodiversity</li>
                                        <li className="mb-2">✓ Toxicity assays and EDA</li>
                                        <li className="mb-2">✓ Bioaccumulation/Biomagnification</li>
                                    </ul>
                                    
                                    <div className="alert alert-success border-0" style={{ backgroundColor: '#e8f5e8' }}>
                                        <strong>Connected Infrastructure:</strong> This database is planned to be connected with other key European repositories and e-infrastructures to disseminate research findings and valuable information.
                                    </div>
                                </CardBody>
                            </Card>

                        </Col>

                        <Col lg={4} md={12}>
                            <Card className="sticky-top border-0 shadow-sm" style={{ top: '20px' }}>
                                <CardBody>
                                    <h5 className="mb-3">📊 Quick Links</h5>
                                    
                                    <div className="mt-4">
                                        <div className="alert alert-light border border-primary">
                                            <h6 className="mb-2">👥 Database Contributors</h6>
                                            <p className="mb-2 small">
                                                Want to view the organizations who contribute data to the CECsMarineDB?
                                            </p>
                                            <a href="/publishers" className="btn btn-primary btn-sm">
                                                View Contributors →
                                            </a>
                                        </div>
                                        
                                        <div className="alert alert-light border border-success mt-3">
                                            <h6 className="mb-2">🔗 Explore Datasets</h6>
                                            <p className="mb-2 small">
                                                Browse the available datasets and research data in the CECsMarineDB.
                                            </p>
                                            <a href="/search" className="btn btn-success btn-sm">
                                                Browse Datasets →
                                            </a>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        </Layout>
    );
};

export default About;
