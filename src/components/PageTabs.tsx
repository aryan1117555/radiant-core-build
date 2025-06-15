
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PageTab {
  id: string;
  label: string;
}

interface PageTabsProps {
  tabs: PageTab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const PageTabs: React.FC<PageTabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="mb-4 sm:mb-6 w-full">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="w-full h-auto p-1 bg-muted/50 backdrop-blur-sm rounded-lg overflow-hidden">
          <div className="w-full grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="w-full text-center px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md transition-all duration-200 hover:bg-background/50"
              >
                <span className="truncate">{tab.label}</span>
              </TabsTrigger>
            ))}
          </div>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default PageTabs;
