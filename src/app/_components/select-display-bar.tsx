import React, { useState, CSSProperties } from 'react';
import Collapsible from './collapsible';
const NavBar: React.FC = () => {
    const [activeOption, setActiveOption] = useState<string | null>('Data Collection');

    const handleNavClick = (option: string) => {
        setActiveOption(option);
    };

    return (
        <div>
            <nav className='methodNavBar'>
                {['Data Collection', 'Verification', 'Geolocation', 'Data Analysis'].map((option) => (
                    <button
                        key={option}
                        onClick={() => handleNavClick(option)}
                        style={{
                            color: activeOption === option ? '#fff' : '#aaa',
                            borderBottom: activeOption === option ? '1px solid #fff' : '1px solid transparent',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        {`→ ${option === 'Geolocation' ? 'Geolocation and Chronolocation'.toUpperCase() : option.toUpperCase()}`}
                    </button>
                ))}
            </nav>
            <div className='method-content'>
                <div
                    style={{
                        ...dropdownStyles,
                        opacity: activeOption === 'Data Collection' ? 1 : 0,
                        visibility: activeOption === 'Data Collection' ? 'visible' : 'hidden',
                    }}
                >    {activeOption === 'Data Collection' &&
                    <p>Our data collection strategy employs web scraping to gather reports from multiple online platforms, including X (Twitter), Facebook, Telegram channels, Instagram, and news articles. Additionally, we receive direct footage and reports from eyewitnesses on the ground, which provide real-time and first-hand accounts of the incidents. This combination of digital scraping and on-the-ground reporting ensures a comprehensive and diverse dataset.
                    </p>
                    }</div>
                <div
                    style={{
                        ...dropdownStyles,
                        opacity: activeOption === 'Verification' ? 1 : 0,
                        visibility: activeOption === 'Verification' ? 'visible' : 'hidden',
                    }}
                >    {activeOption === 'Verification' &&
                    <p>In collaboration with weapons experts, we have developed a detailed verification process that specifically involves analyzing footage capturing the first seconds of the impact of white phosphorus, which clearly displays its characteristic tentacular shape. To prevent misidentification with other incendiary weapons, any footage that captures the aftermath minutes later and lacks clear visual evidence of tentacles is excluded. This approach is supported by cross-referencing with multiple sources and utilizing high-resolution satellite imagery to confirm the geographic locations and extents of impact, particularly when happening over green area.
                    </p>}
                </div>
                <div
                    style={{
                        ...dropdownStyles,
                        opacity: activeOption === 'Geolocation' ? 1 : 0,
                        visibility: activeOption === 'Geolocation' ? 'visible' : 'hidden',
                    }}
                >     {activeOption === 'Geolocation' &&
                    <p>We start with the geolocation process by identifying landmarks and visual cues in the footage to precisely determine where the attack occurred. As for the chronolocation, we confirm the timing of the incidents by examining satellite imagery before and after the attack to verify it took place on the claimed date. This combined approach is essential for analyzing patterns in the timing and geographic distribution of attacks, ensuring that we avoid using recycled footage from other conflicts.</p>
                    }</div>
                <div
                    style={{
                        ...dropdownStyles,
                        opacity: activeOption === 'Data Analysis' ? 1 : 0,
                        visibility: activeOption === 'Data Analysis' ? 'visible' : 'hidden',
                    }}
                >     {activeOption === 'Data Analysis' &&
                    <p>We apply statistical methods to assess the frequency, timing, and geographical distribution of white phosphorus usage. This involves identifying hotspots of activity and temporal patterns that may indicate strategic shifts or escalations in conflict. This analysis helps in understanding the broader implications of white phosphorus deployment, informing our strategies for advocacy and intervention.</p>
                    }
                </div>
            </div>
        </div >
    );
};

const dropdownStyles: CSSProperties = {
    overflow: 'hidden',
    transition: 'opacity 0.3s ease-in-out, visibility 0.7s ease-in-out',
    opacity: 0,
    visibility: 'hidden',
    position: 'relative'
};
export default NavBar;
