'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { cityData } from '../data/cityData';

// 預設高亮的縣市列表
// 台北縣 -> 新北市
const highlightedCounties = ['臺北市','新北市', '桃園市', '新竹縣', '新竹市', '臺中市', '臺南市', '高雄市'];
const primaryColor = '#00bed6'; // 企業主色 (logo-color)

const ServiceMap = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedCity, setSelectedCity] = useState({
    chinese: 'BTW 浩華企業',
    english: '服務地區版圖',
    description: '智能熱食取餐機、貨到機<br>輪動櫃位、取餐貨架<br>取餐系統生態系<br>進駐全台灣各大企業服務地區<br>__________________________<br>總服務人數已達 10,000人以上'
  });

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const renderMap = async () => {
      // Clear previous render
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();

      // Add definitions for filters/gradients if needed
      const defs = svg.append("defs");
      
      // Add drop shadow filter
      const filter = defs.append("filter")
          .attr("id", "drop-shadow")
          .attr("height", "130%");
      
      filter.append("feGaussianBlur")
          .attr("in", "SourceAlpha")
          .attr("stdDeviation", 3)
          .attr("result", "blur");
      
      filter.append("feOffset")
          .attr("in", "blur")
          .attr("dx", 2)
          .attr("dy", 2)
          .attr("result", "offsetBlur");
          
      const feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "offsetBlur");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");

      // Get container dimensions
      const width = containerRef.current?.offsetWidth || 800;
      const height = containerRef.current?.offsetHeight || 600;

      // Setup SVG
      svg
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`);

      try {
        const data: any = await d3.json('/taiwan.geojson');
        if (!data || !data.features) return;

        // Configure projection to fit container
        const padding = 20;
        const projection = d3.geoMercator()
          .fitExtent(
            [[padding, padding], [width - padding, height - padding]], 
            data
          );

        const pathGenerator = d3.geoPath().projection(projection);

        // Helper function to check if a county is highlighted
        const isHighlighted = (name: string) => highlightedCounties.includes(name);

        svg
          .selectAll('path')
          .data(data.features)
          .enter()
          .append('path')
          .attr('d', pathGenerator as any)
          .attr('id', (d: any) => 'city' + d.properties.COUNTYCODE)
          .classed('highlighted-region', (d: any) => isHighlighted(d.properties.COUNTYNAME)) // Add class for CSS animation
          .style('fill', (d: any) => 
            isHighlighted(d.properties.COUNTYNAME) ? primaryColor : 'transparent'
          )
          .style('stroke', '#000') // Black strokes for white background
          .style('stroke-width', (d: any) => isHighlighted(d.properties.COUNTYNAME) ? '1px' : '0.5px')
          .style('cursor', (d: any) => isHighlighted(d.properties.COUNTYNAME) ? 'pointer' : 'default')
          .style('transition', 'all 0.3s ease')
          .on('click', function(event, d: any) {
            if (!isHighlighted(d.properties.COUNTYNAME)) return; // Only allow clicking highlighted areas

            const countyName = d.properties.COUNTYNAME;
            const customData = cityData[countyName];

            // Update state
            setSelectedCity({
              chinese: customData?.chinese || d.properties.COUNTYNAME,
              english: customData?.english || d.properties.COUNTYENG,
              description: customData?.description || ''
            });

            // Handle active class visuals
            // First reset ALL paths
            svg.selectAll('path')
               .classed('active', false)
               .style('fill', (d: any) => 
                 isHighlighted(d.properties.COUNTYNAME) ? primaryColor : 'transparent'
               )
               .style('stroke', '#000')
               .style('filter', null);

            // Then highlight the clicked one
            d3.select(this)
              .classed('active', true)
              .style('fill', '#FFCA28') // Keep the yellow highlight
              .style('stroke', '#F57F17')
              .style('filter', 'url(#drop-shadow)');
          })
          .on('mouseover', function(event, d: any) {
            if (!isHighlighted(d.properties.COUNTYNAME)) return;

            const el = d3.select(this);
            if (!el.classed('active')) {
              el.style('fill', '#4dd0e1') // Lighter version of primary color on hover
                .style('filter', 'url(#drop-shadow)')
                .style('transform', 'scale(1.01)'); // Slight scale effect
            }
          })
          .on('mouseout', function(event, d: any) {
            if (!isHighlighted(d.properties.COUNTYNAME)) return;

            const el = d3.select(this);
            if (!el.classed('active')) {
              el.style('fill', primaryColor)
                .style('stroke', '#000') // Reset to black
                .style('filter', null)
                .style('transform', 'scale(1)');
            }
          });

      } catch (error) {
        console.error('Error loading map data:', error);
      }
    };

    renderMap();

    const handleResize = () => {
        renderMap();
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
        window.removeEventListener('resize', handleResize);
    };

  }, []);

  return (
    <div className="w-full text-black p-4 md:p-8 overflow-hidden">
        {/* Add CSS Animation styles */}
        <style>{`
          @keyframes pulse-color {
            0% { fill: ${primaryColor}; }
            50% { fill: #b2ebf2; } 
            100% { fill: ${primaryColor}; }
          }
          /* Only animate if not active and not hovered (handled by JS events mostly, but CSS helps initial state) */
          .highlighted-region:not(.active):not(:hover) {
            animation: pulse-color 2s infinite ease-in-out;
          }
        `}</style>

        <div className="flex flex-col md:flex-row items-center justify-between min-h-[500px] md:min-h-[600px]">
            {/* Map Container */}
            <div 
                ref={containerRef} 
                className="w-full md:w-1/2 h-[400px] md:h-[600px] flex justify-center items-center relative"
            >
                <svg ref={svgRef} className="max-h-full w-full block"></svg>
                
                {/* Visual Instruction Overlay */}
                <div className="absolute bottom-12 w-full flex justify-center pointer-events-none z-10">
                  <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200 flex items-center gap-2 animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">點擊藍色縣市查看詳細據點</span>
                  </div>
                </div>
            </div>
            
            {/* Info Container - 右側資訊欄位 */}
            <div className="w-full md:w-1/2 flex flex-col justify-center items-center space-y-4 md:space-y-8 mt-4 md:mt-0 p-4">
                
                {/* 1. 縣市中文名稱 (例如：臺北市) */}
                {/* text-black: 文字顏色 | font-bold: 粗體 */}
                {/* text-4xl ... lg:text-[5vw]: 不同螢幕尺寸的字體大小 */}
                {/* lg:text-[5vw] 會讓桌機版文字變得很大 (螢幕寬度的 5%)，如果覺得太大可以改成 lg:text-4xl 或更小 */}
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black relative pb-4 after:content-[''] after:absolute after:left-1/2 after:bottom-0 after:w-[80%] after:h-[2px] after:bg-gradient-to-r after:from-transparent after:via-black/20 after:to-transparent after:-translate-x-1/2 text-center">
                    {selectedCity.chinese}
                </h1>
                
                {/* 2. 縣市英文名稱 (例如：Taipei City) */}
                {/* text-gray-800: 深灰色文字 */}
                <h2 className="text-xl md:text-2xl lg:text-2xl font-bold text-gray-800 text-center">
                    {selectedCity.english}
                </h2>

                {/* 3. 補充說明文字 (例如：首都圈核心) */}
                {/* text-gray-600: 中灰色文字 | max-w-md: 限制最大寬度 */}
                {/* whitespace-pre-wrap: 保留換行符號 | dangerouslySetInnerHTML: 允許 HTML 標籤 */}
                {/* text-lg: 字體縮小一級 (原為 text-xl) | leading-[3]: 自定義行距 (數值越大行距越寬) */}
                {selectedCity.description && (
                  <div 
                    className="text-lg md:text-lg text-gray-600 text-center max-w-md"
                  >
                    {selectedCity.description.split(/<br\s*\/?>|\n/).map((line, index) => (
                      <div key={index} className="leading-[2] min-h-[1.5em]">
                        {line}
                      </div>
                    ))}
                  </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ServiceMap;
