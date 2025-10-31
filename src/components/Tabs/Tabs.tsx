import React from 'react';
import { TabsHeader, TabButton, TabsContent } from './Tabs.styles';

export type TabItem = {
  key: string;
  label: string;
  content: React.ReactNode;
};

export type TabsProps = {
  items: TabItem[];
  defaultActiveKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
};

export const Tabs: React.FC<TabsProps> = ({ items, defaultActiveKey, activeKey, onChange }) => {
  const [internalKey, setInternalKey] = React.useState<string>(defaultActiveKey ?? items[0]?.key);
  const currentKey = activeKey ?? internalKey;
  const current = items.find((i) => i.key === currentKey) ?? items[0];

  const select = (key: string) => {
    if (activeKey === undefined) setInternalKey(key);
    onChange?.(key);
  };

  return (
    <>
      <TabsHeader>
        {items.map((i) => {
          const isActive = i.key === currentKey;
          return (
            <TabButton key={i.key} onClick={() => select(i.key)} $active={isActive}>
              {i.label}
            </TabButton>
          );
        })}
      </TabsHeader>
      <TabsContent>{current?.content}</TabsContent>
    </>
  );
};

export type TabProps = {
  label: string;
  children: React.ReactNode;
};

export const Tab: React.FC<TabProps> = ({ children }) => {
  return <>{children}</>;
};

