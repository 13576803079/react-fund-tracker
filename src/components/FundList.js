import React, { useState } from 'react';

const FundList = ({ funds, indices, settings, setFunds }) => {
  const [editingFund, setEditingFund] = useState(null);
  const [newFundCode, setNewFundCode] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // 模拟搜索基金
  const searchFunds = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    // 模拟API调用
    const mockResults = [
      { value: '001618', label: '汇添富全球互联混合' },
      { value: '161725', label: '招商中证白酒指数' },
      { value: '005911', label: '广发医疗保健股票' },
      { value: '000063', label: '华夏上证50ETF联接' },
      { value: '001594', label: '汇添富中证主要消费ETF联接' }
    ].filter(item => 
      item.value.includes(query) || item.label.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(mockResults);
  };

  // 添加基金
  const addFund = () => {
    if (newFundCode.trim()) {
      const newFund = {
        fundcode: newFundCode,
        name: `基金${newFundCode}`, // 实际应用中需要通过API获取名称
        jzrq: '2023-11-22',
        dwjz: 1.0000,
        gsz: 1.0000,
        gszzl: 0.00,
        gztime: '2023-11-23 15:00',
        num: 0,
        cost: 0,
        amount: 0,
        gains: 0,
        costGains: 0,
        costGainsRate: 0,
        hasReplace: false
      };
      
      setFunds(prev => [...prev, newFund]);
      setNewFundCode('');
      setShowAddForm(false);
      setSearchResults([]);
    }
  };

  // 删除基金
  const deleteFund = (fundcode) => {
    setFunds(prev => prev.filter(fund => fund.fundcode !== fundcode));
  };

  // 更新基金持仓
  const updateFundHoldings = (fundcode, field, value) => {
    setFunds(prev => prev.map(fund => {
      if (fund.fundcode === fundcode) {
        const updatedFund = { ...fund, [field]: parseFloat(value) || 0 };
        
        // 重新计算相关数值
        if (field === 'num' || field === 'cost') {
          updatedFund.amount = (updatedFund.dwjz * updatedFund.num).toFixed(2);
          updatedFund.gains = (((updatedFund.gsz - updatedFund.dwjz) * updatedFund.num)).toFixed(2);
          if (updatedFund.cost > 0) {
            updatedFund.costGains = ((updatedFund.dwjz - updatedFund.cost) * updatedFund.num).toFixed(2);
            updatedFund.costGainsRate = (((updatedFund.dwjz - updatedFund.cost) / updatedFund.cost) * 100).toFixed(2);
          } else {
            updatedFund.costGains = 0;
            updatedFund.costGainsRate = 0;
          }
        }
        
        return updatedFund;
      }
      return fund;
    }));
  };

  return (
    <div>
      {/* 指数显示区域 */}
      <div className="tab-row" style={{ minHeight: indices.length > 0 ? '55px' : 'auto' }}>
        {indices.map((index, idx) => (
          <div key={index.f12} className="tab-col indFund">
            <h5>{index.f14}</h5>
            <p className={index.f3 >= 0 ? 'up' : 'down'}>
              {index.f2}
            </p>
            <p className={index.f3 >= 0 ? 'up' : 'down'}>
              {index.f4}&nbsp;&nbsp;{index.f3 >= 0 ? '+' : ''}{index.f3}%
            </p>
          </div>
        ))}
      </div>

      {/* 添加基金表单 */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
        {!showAddForm ? (
          <button className="btn" onClick={() => setShowAddForm(true)}>
            添加基金
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              className="btn"
              placeholder="输入基金代码或名称"
              value={newFundCode}
              onChange={(e) => {
                setNewFundCode(e.target.value);
                searchFunds(e.target.value);
              }}
              style={{ width: '200px', marginRight: '5px' }}
            />
            <button className="btn" onClick={addFund}>添加</button>
            <button className="btn" onClick={() => {
              setShowAddForm(false);
              setNewFundCode('');
              setSearchResults([]);
            }}>取消</button>
          </div>
        )}
      </div>

      {showAddForm && searchResults.length > 0 && (
        <div style={{
          position: 'absolute',
          backgroundColor: 'white',
          border: '1px solid #dcdfe6',
          borderRadius: '4px',
          zIndex: 1000,
          maxHeight: '200px',
          overflowY: 'auto',
          minWidth: '200px',
          boxShadow: '0 2px 12px 0 rgba(0,0,0,0.1)'
        }}>
          {searchResults.map((result, idx) => (
            <div
              key={idx}
              className="btn"
              style={{ display: 'block', textAlign: 'left', marginBottom: '0' }}
              onClick={() => {
                setNewFundCode(result.value);
                setSearchResults([]);
              }}
            >
              <span style={{ float: 'left' }}>{result.label}</span>
              <span style={{ float: 'right', color: '#8492a6', fontSize: '13px' }}>
                {result.value}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="tips center">
        部分新发基金或QDII基金可以搜索到，但可能无法获取估值情况
      </p>

      {/* 基金列表 */}
      <div className="table-row" style={{ minHeight: '160px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr>
              <th className="align-left">基金名称（{funds.length}）</th>
              <th>基金代码</th>
              {settings.showGSZ && <th>估算净值</th>}
              <th>持有额</th>
              {settings.showCost && <th>持有收益</th>}
              {settings.showCostRate && <th>持有收益率</th>}
              <th>涨跌幅</th>
              {settings.showGains && <th>估算收益</th>}
              <th>更新时间</th>
              <th style={{ textAlign: 'center' }}>持有份额</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {funds.map((fund, index) => (
              <tr key={fund.fundcode}>
                <td
                  className="fundName align-left"
                  title={fund.name}
                >
                  <span className={fund.hasReplace ? "hasReplace-tip" : ""}>{fund.hasReplace ? '✔' : ''}</span>
                  {fund.name}
                </td>
                <td>{fund.fundcode}</td>
                {settings.showGSZ && <td>{fund.gsz}</td>}
                <td>
                  {(parseFloat(fund.amount) || 0).toLocaleString("zh", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                {settings.showCost && (
                  <td className={(parseFloat(fund.costGains) || 0) >= 0 ? 'up' : 'down'}>
                    {(parseFloat(fund.costGains) || 0).toLocaleString("zh", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                )}
                {settings.showCostRate && (
                  <td className={(parseFloat(fund.costGainsRate) || 0) >= 0 ? 'up' : 'down'}>
                    {fund.cost > 0 ? `${fund.costGainsRate}%` : ""}
                  </td>
                )}
                <td className={parseFloat(fund.gszzl) >= 0 ? 'up' : 'down'}>
                  {parseFloat(fund.gszzl)}%
                </td>
                {settings.showGains && (
                  <td className={(parseFloat(fund.gains) || 0) >= 0 ? 'up' : 'down'}>
                    {(parseFloat(fund.gains) || 0).toLocaleString("zh", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                )}
                <td>
                  {fund.hasReplace 
                    ? fund.gztime.substr(5, 5) 
                    : fund.gztime.substr(10)
                  }
                </td>
                <td style={{ textAlign: 'center' }}>
                  <input
                    className="btn num"
                    placeholder="输入持有份额"
                    value={fund.num || ''}
                    onChange={(e) => updateFundHoldings(fund.fundcode, 'num', e.target.value)}
                    type="text"
                  />
                </td>
                <td>
                  <button
                    onClick={() => deleteFund(fund.fundcode)}
                    className="btn red edit"
                  >
                    ✖
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="tips">
        特别关注功能介绍：指定一个基金，在程序图标中以角标的形式实时更新，请在设置中选择角标类型与内容。
      </p>
    </div>
  );
};

export default FundList;