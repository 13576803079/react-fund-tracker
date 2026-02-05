import React, { useState, useEffect } from 'react';
import FundList from './components/FundList';
import ControlPanel from './components/ControlPanel';
import './index.css';

const App = () => {
  const [funds, setFunds] = useState([]);
  const [indices, setIndices] = useState([]);
  const [settings, setSettings] = useState({
    darkMode: false,
    showAmount: false,
    showGains: false,
    showCost: false,
    showCostRate: false,
    showGSZ: false,
    isLiveUpdate: false,
    isDuringDate: true // 模拟交易时间
  });

  // 模拟获取基金数据
  const fetchFundData = async () => {
    // 这里应该是实际的API调用
    // 模拟数据
    const mockFunds = [
      {
        fundcode: '001618',
        name: '汇添富全球互联混合',
        jzrq: '2023-11-22',
        dwjz: 2.3456,
        gsz: 2.3678,
        gszzl: 0.95,
        gztime: '2023-11-23 15:00',
        num: 1000,
        cost: 2.2,
        amount: 2345.60,
        gains: 22.20,
        costGains: 145.60,
        costGainsRate: 6.25,
        hasReplace: false
      },
      {
        fundcode: '161725',
        name: '招商中证白酒指数',
        jzrq: '2023-11-22',
        dwjz: 0.7890,
        gsz: 0.7950,
        gszzl: 0.76,
        gztime: '2023-11-23 15:00',
        num: 2000,
        cost: 0.8,
        amount: 1578.00,
        gains: 12.00,
        costGains: -2.00,
        costGainsRate: -0.13,
        hasReplace: false
      },
      {
        fundcode: '005911',
        name: '广发医疗保健股票',
        jzrq: '2023-11-22',
        dwjz: 2.1234,
        gsz: 2.0987,
        gszzl: -1.16,
        gztime: '2023-11-23 15:00',
        num: 1500,
        cost: 2.15,
        amount: 3185.10,
        gains: -37.05,
        costGains: -37.05,
        costGainsRate: -1.16,
        hasReplace: false
      }
    ];
    
    setFunds(mockFunds);
  };

  // 模拟获取指数数据
  const fetchIndexData = async () => {
    const mockIndices = [
      {
        f12: '000001',
        f13: '1',
        f14: '上证指数',
        f2: 2950.12,
        f3: 0.35,
        f4: 2940.25
      },
      {
        f12: '000300',
        f13: '1',
        f14: '沪深300',
        f2: 3980.45,
        f3: 0.52,
        f4: 3960.23
      },
      {
        f12: '399001',
        f13: '0',
        f14: '深证成指',
        f2: 8900.34,
        f3: -0.12,
        f4: 8910.12
      },
      {
        f12: '399006',
        f13: '0',
        f14: '创业板指',
        f2: 1780.56,
        f3: 0.78,
        f4: 1767.23
      }
    ];
    
    setIndices(mockIndices);
  };

  useEffect(() => {
    fetchFundData();
    fetchIndexData();
  }, []);

  // 计算总收益
  const totalGains = funds.reduce((sum, fund) => sum + parseFloat(fund.gains || 0), 0);
  const totalCostGains = funds.reduce((sum, fund) => sum + parseFloat(fund.costGains || 0), 0);

  return (
    <div className={`container ${settings.darkMode ? 'darkMode' : ''}`}>
      <ControlPanel 
        settings={settings} 
        setSettings={setSettings} 
        totalGains={totalGains}
        totalCostGains={totalCostGains}
      />
      
      <FundList 
        funds={funds} 
        indices={indices}
        settings={settings}
        setFunds={setFunds}
      />
    </div>
  );
};

export default App;