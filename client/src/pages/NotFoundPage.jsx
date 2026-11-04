import React from 'react';
import { ArrowLeft, Compass } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import Container from '../components/common/Container';
import Button from '../components/common/Button';
import SectionLabel from '../components/common/SectionLabel';

export const NotFoundPage = () => {
  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="not-found-main">
        <Container size="narrow">
          <div className="not-found-content">
            <SectionLabel variant="forest" number="404">
              ROUTE UNMAPPED
            </SectionLabel>
            <h1 className="not-found-title">
              This sector does not exist on the sanitation grid.
            </h1>
            <p className="not-found-desc">
              The page or resource you requested may have been relocated, resolved, or archived. 
              Return to the central CleanLoop civic portal to continue.
            </p>
            <div className="not-found-actions">
              <Button to="/" variant="primary" size="md" icon={ArrowLeft} iconPosition="left">
                Return to CleanLoop Home
              </Button>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

export default NotFoundPage;
