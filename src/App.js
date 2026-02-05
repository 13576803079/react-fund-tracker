import React, { useState, useEffect } from 'react';
import FundList from './components/FundList';
import ControlPanel from './components/ControlPanel';
import './index.css';
import axios from 'axios';

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

  // 获取真实的指数数据
  const fetchIndexData = async () => {
    try {
      const seciList = ['1.000001', '1.000300', '0.399001', '0.399006']; // 默认指数列表
      const seciListStr = seciList.join(',');
      const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f13,f14&secids=${seciListStr}&_=${new Date().getTime()}`;
      
      const response = await axios.get(url);
      if (response.data && response.data.data && response.data.data.diff) {
        setIndices(response.data.data.diff);
      }
    } catch (error) {
      console.error('获取指数数据失败:', error);
      // 设置默认值以防API失败
      setIndices([
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
      ]);
    }
  };

  useEffect(() => {
    fetchIndexData();
    
    // 设置定时器定期更新指数数据（仅在交易时间内）
    const interval = setInterval(() => {
      if (settings.isLiveUpdate && settings.isDuringDate) {
        fetchIndexData();
      }
    }, 5000); // 每5秒更新一次指数数据
    
    return () => clearInterval(interval);
  }, [settings.isLiveUpdate, settings.isDuringDate]);

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