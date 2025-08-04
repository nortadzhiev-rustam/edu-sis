/**
 * DoughnutChart Component
 * A reusable doughnut chart component using react-native-svg
 */

import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import Svg, { Circle, G, Text as SvgText } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

const DoughnutChart = ({
  data = [],
  labels = [],
  colors = ['#3498db', '#e74c3c', '#f39c12', '#2ecc71', '#9b59b6'],
  size = Math.min(screenWidth * 0.6, 200),
  strokeWidth = 20,
  showLabels = true,
  showValues = true,
  centerText = null,
  showCenterPercentage = true,
  centerPercentageIndex = null, // Index of segment to show percentage for, null = largest segment
  theme,
  style = {},
}) => {
  if (!data || data.length === 0) {
    return (
      <View
        style={[
          { alignItems: 'center', justifyContent: 'center', height: size },
          style,
        ]}
      >
        <Text
          style={{
            color: theme?.colors?.textSecondary || '#666',
            fontSize: 16,
          }}
        >
          No data available
        </Text>
      </View>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const total = data.reduce((sum, value) => sum + value, 0);

  // Calculate angles for each segment
  const segments = data.map((value, index) => {
    const percentage = value / total;
    const angle = percentage * 2 * Math.PI;
    return {
      value,
      percentage,
      angle,
      color: colors[index % colors.length],
      label: labels[index] || `Item ${index + 1}`,
    };
  });

  // Calculate cumulative angles for positioning
  let cumulativeAngle = -Math.PI / 2; // Start from top
  const segmentsWithPositions = segments.map((segment) => {
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + segment.angle;
    cumulativeAngle = endAngle;

    return {
      ...segment,
      startAngle,
      endAngle,
    };
  });

  // Calculate center percentage to display
  const getCenterPercentage = () => {
    if (!showCenterPercentage) return null;

    let targetSegment;
    if (
      centerPercentageIndex !== null &&
      centerPercentageIndex < segments.length
    ) {
      // Use specified index
      targetSegment = segments[centerPercentageIndex];
    } else {
      // Find the largest segment
      targetSegment = segments.reduce(
        (max, segment) => (segment.value > max.value ? segment : max),
        segments[0]
      );
    }

    return targetSegment ? (targetSegment.percentage * 100).toFixed(1) : null;
  };

  const centerPercentage = getCenterPercentage();

  const renderLegend = () => {
    if (!showLabels) return null;

    return (
      <View style={{ marginTop: 16, alignItems: 'center' }}>
        {segments.map((segment, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginVertical: 4,
              paddingHorizontal: 8,
            }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                backgroundColor: segment.color,
                borderRadius: 6,
                marginRight: 8,
              }}
            />
            <Text
              style={{
                color: theme?.colors?.text || '#333',
                fontSize: 14,
                flex: 1,
              }}
            >
              {segment.label}
            </Text>
            {showValues && (
              <Text
                style={{
                  color: theme?.colors?.textSecondary || '#666',
                  fontSize: 14,
                  fontWeight: '600',
                  marginLeft: 8,
                }}
              >
                {segment.value} ({(segment.percentage * 100).toFixed(1)}%)
              </Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[{ alignItems: 'center' }, style]}>
      <View style={{ position: 'relative' }}>
        <Svg width={size} height={size}>
          <G>
            {segmentsWithPositions.map((segment, index) => (
              <Circle
                key={index}
                cx={centerX}
                cy={centerY}
                r={radius}
                stroke={segment.color}
                strokeWidth={strokeWidth}
                fill='transparent'
                strokeDasharray={`${
                  segment.percentage * 2 * Math.PI * radius
                } ${2 * Math.PI * radius}`}
                strokeDashoffset={
                  -segmentsWithPositions
                    .slice(0, index)
                    .reduce(
                      (sum, s) => sum + s.percentage * 2 * Math.PI * radius,
                      0
                    )
                }
                rotation={-90}
                origin={`${centerX}, ${centerY}`}
              />
            ))}
          </G>

          {/* Center Text or Percentage */}
          {centerText ? (
            <SvgText
              x={centerX}
              y={centerY}
              textAnchor='middle'
              alignmentBaseline='middle'
              fontSize='16'
              fontWeight='bold'
              fill={theme?.colors?.text || '#333'}
            >
              {centerText}
            </SvgText>
          ) : centerPercentage ? (
            <G>
              <SvgText
                x={centerX}
                y={centerY - 8}
                textAnchor='middle'
                alignmentBaseline='middle'
                fontSize='24'
                fontWeight='bold'
                fill={theme?.colors?.primary || '#3498db'}
              >
                {`${centerPercentage}%`}
              </SvgText>
              <SvgText
                x={centerX}
                y={centerY + 12}
                textAnchor='middle'
                alignmentBaseline='middle'
                fontSize='12'
                fill={theme?.colors?.textSecondary || '#666'}
              >
                {segments.find(
                  (s) =>
                    s.percentage ===
                    Math.max(...segments.map((seg) => seg.percentage))
                )?.label || 'Total'}
              </SvgText>
            </G>
          ) : null}
        </Svg>
      </View>

      {renderLegend()}
    </View>
  );
};

export default DoughnutChart;
