// src/components/HomescreenHeader.tsx

//import React from 'react';
import './HomescreenHeader.css';

const HomescreenHeader = () => {
  return (
    <header className="homescreen-header">
      <div className="header-info">
        <h1 className="company-name">Altheon Medical Expertise</h1>
        <p className="slogan">Un dossier patient numérique pensé pour vous, afin que chaque histoire médicale soit claire, fiable et facile à suivre.</p>
      </div>
    </header>
  );
};

export default HomescreenHeader;