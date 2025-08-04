/**
 * BarChart Component
 * A reusable bar chart component using react-native-svg
 */

import React from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import Svg, { Rect, G, Text as SvgText, Line } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

const BarChart = ({
  data = [],
  labels = [],
  colors = ['#3498db'],
  width = screenWidth - 40,
  height = 200,
  showValues = true,
  showGrid = true,
  maxValue = null,
  minValue = 0,
  barWidth = null,
  spacing = 8,
  theme,
  style = {},
  scrollable = false,
}) => {
  if (!data || data.length === 0) {
    return (
      <View style={[{ alignItems: 'center', justifyContent: 'center', height }, style]}>
        <Text style={{ color: theme?.colors?.textSecondary || '#666', fontSize: 16 }}>
          No data available
        </Text>
      </View>
    );
  }

  const chartHeight = height - 60; // Leave space for labels
  const chartWidth = width - 60; // Leave space for y-axis labels
  const actualMaxValue = maxValue || Math.max(...data);
  const actualMinValue = Math.min(minValue, Math.min(...data));
  const valueRange = actualMaxValue - actualMinValue;

  // Calculate bar dimensions
  const calculatedBarWidth = barWidth || (chartWidth - (data.length - 1) * spacing) / data.length;
  const totalChartWidth = data.length * calculatedBarWidth + (data.length - 1) * spacing;
  const shouldScroll = scrollable && totalChartWidth > chartWidth;
  const finalWidth = shouldScroll ? Math.max(totalChartWidth + 60, width) : width;

  // Generate grid lines
  const gridLines = [];
  const numGridLines = 5;
  for (let i = 0; i <= numGridLines; i++) {
    const y = (chartHeight / numGridLines) * i;
    const value = actualMaxValue - (valueRange / numGridLines) * i;
    gridLines.push({ y, value });
  }

  const renderChart = () => (
    <View style={{ width: finalWidth }}>
      <Svg width={finalWidth} height={height}>
        <G>
          {/* Grid lines */}
          {showGrid && gridLines.map((line, index) => (
            <G key={index}>
              <Line
                x1={50}
                y1={line.y + 10}
                x2={finalWidth - 10}
                y2={line.y + 10}
                stroke={theme?.colors?.border || '#e0e0e0'}
                strokeWidth={0.5}
                strokeDasharray={index === gridLines.length - 1 ? '0' : '2,2'}
              />
              <SvgText
                x={45}
                y={line.y + 15}
                textAnchor="end"
                fontSize="10"
                fill={theme?.colors?.textSecondary || '#666'}
              >
                {Math.round(line.value)}
              </SvgText>
            </G>
          ))}

          {/* Bars */}
          {data.map((value, index) => {
            const barHeight = ((value - actualMinValue) / valueRange) * chartHeight;
            const x = 50 + index * (calculatedBarWidth + spacing);
            const y = chartHeight - barHeight + 10;
            const color = Array.isArray(colors) ? colors[index % colors.length] : colors;

            return (
              <G key={index}>
                <Rect
                  x={x}
                  y={y}
                  width={calculatedBarWidth}
                  height={barHeight}
                  fill={color}
                  rx={2}
                />
                
                {/* Value labels on bars */}
                {showValues && (
                  <SvgText
                    x={x + calculatedBarWidth / 2}
                    y={y - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="bold"
                    fill={theme?.colors?.text || '#333'}
                  >
                    {typeof value === 'number' ? value.toFixed(1) : value}
                  </SvgText>
                )}

                {/* X-axis labels */}
                {labels[index] && (
                  <SvgText
                    x={x + calculatedBarWidth / 2}
                    y={height - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fill={theme?.colors?.textSecondary || '#666'}
                    transform={`rotate(-45, ${x + calculatedBarWidth / 2}, ${height - 5})`}
                  >
                    {labels[index].length > 10 ? labels[index].substring(0, 10) + '...' : labels[index]}
                  </SvgText>
                )}
              </G>
            );
          })}

          {/* Y-axis line */}
          <Line
            x1={50}
            y1={10}
            x2={50}
            y2={chartHeight + 10}
            stroke={theme?.colors?.border || '#e0e0e0'}
            strokeWidth={1}
          />

          {/* X-axis line */}
          <Line
            x1={50}
            y1={chartHeight + 10}
            x2={finalWidth - 10}
            y2={chartHeight + 10}
            stroke={theme?.colors?.border || '#e0e0e0'}
            strokeWidth={1}
          />
        </G>
      </Svg>
    </View>
  );

  if (shouldScroll) {
    return (
      <View style={[style]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {renderChart()}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[style]}>
      {renderChart()}
    </View>
  );
};

export default BarChart;
