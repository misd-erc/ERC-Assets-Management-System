import React from 'react';
import UnderConstructionContent from '../components/under-construction/UnderConstructionContent';

const UnderConstructionPage: React.FC = () => {
  const handleNavigate = (module: string) => {
    // Handle navigation if needed, or pass a no-op function
  };

  return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)] w-full">
      <UnderConstructionContent onNavigate={handleNavigate} />
    </div>
  );
};

export default UnderConstructionPage;
