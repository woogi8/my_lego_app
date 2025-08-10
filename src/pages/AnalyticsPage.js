import React from 'react';
import { useLegoContext } from '../context/LegoContext';
import { calculateProfitRate, formatCurrency } from '../utils/legoUtils';
import './AnalyticsPage.css';

const AnalyticsPage = () => {
  const { legoList } = useLegoContext();

  const getAnalysisData = () => {
    const validData = legoList.filter(lego => {
      const purchasePrice = parseFloat(lego['구입 가격 (원)']) || 0;
      const currentPrice = parseFloat(lego['현재 시세 (원)']) || 0;
      return purchasePrice > 0 && currentPrice > 0;
    });

    const totalInvestment = validData.reduce((sum, lego) => 
      sum + (parseFloat(lego['구입 가격 (원)']) || 0), 0);
    
    const totalCurrentValue = validData.reduce((sum, lego) => 
      sum + (parseFloat(lego['현재 시세 (원)']) || 0), 0);

    const totalProfit = totalCurrentValue - totalInvestment;
    const totalProfitRate = totalInvestment > 0 ? (totalProfit / totalInvestment * 100) : 0;

    // Profit ranges analysis
    const profitRanges = {
      '20% 이상': 0,
      '10-20%': 0,
      '0-10%': 0,
      '0~-10%': 0,
      '-10% 이하': 0
    };

    validData.forEach(lego => {
      const rate = calculateProfitRate(lego);
      if (rate >= 20) profitRanges['20% 이상']++;
      else if (rate >= 10) profitRanges['10-20%']++;
      else if (rate >= 0) profitRanges['0-10%']++;
      else if (rate >= -10) profitRanges['0~-10%']++;
      else profitRanges['-10% 이하']++;
    });

    // Theme analysis
    const themeAnalysis = {};
    validData.forEach(lego => {
      const theme = lego['테마'] || '미분류';
      if (!themeAnalysis[theme]) {
        themeAnalysis[theme] = {
          count: 0,
          totalInvestment: 0,
          totalCurrentValue: 0
        };
      }
      const purchasePrice = parseFloat(lego['구입 가격 (원)']) || 0;
      const currentPrice = parseFloat(lego['현재 시세 (원)']) || 0;
      
      themeAnalysis[theme].count++;
      themeAnalysis[theme].totalInvestment += purchasePrice;
      themeAnalysis[theme].totalCurrentValue += currentPrice;
    });

    // Calculate profit rate for each theme
    Object.keys(themeAnalysis).forEach(theme => {
      const data = themeAnalysis[theme];
      data.profit = data.totalCurrentValue - data.totalInvestment;
      data.profitRate = data.totalInvestment > 0 ? 
        (data.profit / data.totalInvestment * 100) : 0;
    });

    // Top/Worst performers
    const sortedByProfitRate = validData
      .map(lego => ({ ...lego, profitRate: calculateProfitRate(lego) }))
      .sort((a, b) => b.profitRate - a.profitRate);

    return {
      totalItems: legoList.length,
      validItems: validData.length,
      totalInvestment,
      totalCurrentValue,
      totalProfit,
      totalProfitRate,
      profitRanges,
      themeAnalysis,
      topPerformers: sortedByProfitRate.slice(0, 5),
      worstPerformers: sortedByProfitRate.slice(-5).reverse()
    };
  };

  const data = getAnalysisData();

  return (
    <div className="analytics-page">
      <h2>포트폴리오 분석</h2>

      <div className="analytics-summary">
        <div className="summary-card">
          <h3>전체 요약</h3>
          <div className="summary-item">
            <span>총 레고 수:</span>
            <strong>{data.totalItems}개</strong>
          </div>
          <div className="summary-item">
            <span>총 투자금액:</span>
            <strong>{formatCurrency(data.totalInvestment)}</strong>
          </div>
          <div className="summary-item">
            <span>현재 총 가치:</span>
            <strong>{formatCurrency(data.totalCurrentValue)}</strong>
          </div>
          <div className="summary-item">
            <span>총 수익:</span>
            <strong className={data.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}>
              {formatCurrency(data.totalProfit)}
            </strong>
          </div>
          <div className="summary-item">
            <span>총 수익률:</span>
            <strong className={data.totalProfitRate >= 0 ? 'profit-positive' : 'profit-negative'}>
              {data.totalProfitRate.toFixed(2)}%
            </strong>
          </div>
        </div>

        <div className="summary-card">
          <h3>수익률 분포</h3>
          {Object.entries(data.profitRanges).map(([range, count]) => (
            <div key={range} className="summary-item">
              <span>{range}:</span>
              <strong>{count}개</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics-section">
        <h3>테마별 분석</h3>
        <div className="theme-grid">
          {Object.entries(data.themeAnalysis).map(([theme, analysis]) => (
            <div key={theme} className="theme-card">
              <h4>{theme}</h4>
              <div className="theme-stats">
                <div className="stat-item">
                  <span>개수:</span>
                  <strong>{analysis.count}개</strong>
                </div>
                <div className="stat-item">
                  <span>투자금:</span>
                  <strong>{formatCurrency(analysis.totalInvestment)}</strong>
                </div>
                <div className="stat-item">
                  <span>현재가치:</span>
                  <strong>{formatCurrency(analysis.totalCurrentValue)}</strong>
                </div>
                <div className="stat-item">
                  <span>수익률:</span>
                  <strong className={analysis.profitRate >= 0 ? 'profit-positive' : 'profit-negative'}>
                    {analysis.profitRate.toFixed(1)}%
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics-section">
        <h3>TOP 5 수익률</h3>
        <div className="performance-list">
          {data.topPerformers.map((lego, index) => (
            <div key={index} className="performance-item">
              <span className="rank">#{index + 1}</span>
              <span className="name">{lego['제품명']}</span>
              <span className="rate profit-positive">+{lego.profitRate.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics-section">
        <h3>WORST 5 수익률</h3>
        <div className="performance-list">
          {data.worstPerformers.map((lego, index) => (
            <div key={index} className="performance-item">
              <span className="rank">#{index + 1}</span>
              <span className="name">{lego['제품명']}</span>
              <span className="rate profit-negative">{lego.profitRate.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;