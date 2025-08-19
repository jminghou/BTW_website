import { GA_MEASUREMENT_ID, IS_PRODUCTION } from './config';

// 頁面瀏覽追蹤
export const pageview = (url: string) => {
  if (!IS_PRODUCTION || typeof window === 'undefined') return;
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_location: url,
  });
};

// 事件追蹤
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (!IS_PRODUCTION || typeof window === 'undefined') return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
  });
};

// 常用事件追蹤函數
export const trackButtonClick = (buttonName: string, location?: string) => {
  event({
    action: 'click',
    category: 'button',
    label: `${buttonName}${location ? `_${location}` : ''}`,
  });
};

export const trackFormSubmit = (formName: string) => {
  event({
    action: 'submit',
    category: 'form',
    label: formName,
  });
};

export const trackDownload = (fileName: string) => {
  event({
    action: 'download',
    category: 'file',
    label: fileName,
  });
};

export const trackContact = (method: string) => {
  event({
    action: 'contact',
    category: 'engagement',
    label: method,
  });
};

export const trackPageSection = (sectionName: string) => {
  event({
    action: 'view',
    category: 'section',
    label: sectionName,
  });
};
