import React, { useState } from 'react';

const ControlPanel = ({ settings, setSettings, totalGains, totalCostGains }) => {
  const toggleSetting = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  return (
    <div>
      <div className="input-row">
        <button 
          className="btn"
          onClick={() => toggleSetting('darkMode')}
        >
          {settings.darkMode ? '标准模式' : '暗色模式'}
        </button>
        
        <button 
          className="btn"
          onClick={() => toggleSetting('isLiveUpdate')}
          disabled={!settings.isDuringDate}
        >
          {settings.isDuringDate ? (settings.isLiveUpdate ? '暂停更新' : '实时更新') : '休市中'}
        </button>
        
        <button className="btn">设置</button>
        <button className="btn">日志</button>
        
        <button className="btn primary">
          打赏
        </button>
      </div>
      
      {(settings.showGains || settings.showCost) && (
        <div className="input-row">
          {settings.showGains && (
            <button 
              className={`btn ${totalGains >= 0 ? 'btn-up' : 'btn-down'}`}
              title={totalGains >= 0 ? 'd=====(￣▽￣*)b 赞一个' : '∑(っ°Д°;)っ 大事不好啦'}
            >
              日收益：{totalGains.toFixed(2)}
            </button>
          )}
          
          {settings.showCost && (
            <button 
              className={`btn ${totalCostGains >= 0 ? 'btn-up' : 'btn-down'}`}
              title={totalCostGains >= 0 ? 'd=====(￣▽￣*)b 赞一个' : '∑(っ°Д°;)っ 大事不好啦'}
            >
              持有收益：{totalCostGains.toFixed(2)}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ControlPanel;