import { Rocket } from 'lucide-react';

export default function Header() {
    return (
        <div className="header-section">
            <div className="header-title-row">
                <Rocket className="rocket-icon" size={40} />
                <h1 className="main-title">One-Click Deployment</h1>
            </div>
            <p className="subtitle">Deploy your web project live in just a few clicks</p>
        </div>
    );
}
