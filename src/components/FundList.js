import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FundList = ({ funds, indices, settings, setFunds }) => {
  const [editingFund, setEditingFund] = useState(null);
  const [newFundCode, setNewFundCode] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // 模拟获取用户ID（实际应用中可能从存储中获取）
  const getUserId = () => {
    // 检查localStorage中是否有userId，否则生成一个新的
    let userId = localStorage.getItem('fundTrackerUserId');
    if (!userId) {
      userId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      localStorage.setItem('fundTrackerUserId', userId);
    }
    return userId;
  };

  // 获取真实基金数据
  const fetchFundData = async (fundCodes) => {
    if (!fundCodes || fundCodes.length === 0) return [];

    try {
      const userId = getUserId();
      const fundList = fundCodes.join(',');
      const url = `https://fundmobapi.eastmoney.com/FundMNewApi/FundMNFInfo?pageIndex=1&pageSize=${fundCodes.length}&plat=Android&appType=ttjj&product=EFund&Version=1&deviceid=${userId}&Fcodes=${fundList}`;

      const response = await axios.get(url);
      const data = response.data.Datas;

      return data.map(val => {
        const fund = {
          fundcode: val.FCODE,
          name: val.SHORTNAME,
          jzrq: val.PDATE,
          dwjz: isNaN(val.NAV) ? null : parseFloat(val.NAV),
          gsz: isNaN(val.GSZ) ? null : parseFloat(val.GSZ),
          gszzl: isNaN(val.GSZZL) ? 0 : parseFloat(val.GSZZL),
          gztime: val.GZTIME,
        };

        // 如果净值日期等于估值时间，则使用实际净值
        if (val.PDATE !== "--" && val.PDATE === val.GZTIME.substr(0, 10)) {
          fund.gsz = parseFloat(val.NAV);
          fund.gszzl = isNaN(val.NAVCHGRT) ? 0 : parseFloat(val.NAVCHGRT);
          fund.hasReplace = true;
        }

        return fund;
      });
    } catch (error) {
      console.error('获取基金数据失败:', error);
      // 返回模拟数据以防止错误
      return fundCodes.map(code => ({
        fundcode: code,
        name: `基金${code}`,
        jzrq: '2023-11-22',
        dwjz: 1.0000,
        gsz: 1.0000,
        gszzl: 0.00,
        gztime: '2023-11-23 15:00',
        hasReplace: false
      }));
    }
  };

  // 模拟搜索基金
  const searchFunds = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const url = `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?&m=9&key=${encodeURIComponent(query)}&_=${new Date().getTime()}`;
      const response = await axios.get(url);
      
      if (response.data && response.data.Datas) {
        const results = response.data.Datas.map(val => ({
          value: val.CODE,
          label: val.NAME,
        }));
        
        setSearchResults(results);
      }
    } catch (error) {
      console.error('搜索基金失败:', error);
    }
  };

  // 获取用户持有的基金数据
  const fetchUserFunds = async () => {
    // 从localStorage获取用户基金列表
    const userFundsStr = localStorage.getItem('userFunds');
    const userFunds = userFundsStr ? JSON.parse(userFundsStr) : [];

    if (userFunds.length > 0) {
      const fundCodes = userFunds.map(f => f.code);
      const fundData = await fetchFundData(fundCodes);

      // 合并用户持有的份额和成本信息
      return fundData.map(fund => {
        const userFund = userFunds.find(uf => uf.code === fund.fundcode);
        const num = userFund?.num || 0;
        const cost = userFund?.cost || 0;

        // 计算相关数据
        const amount = (fund.dwjz * num).toFixed(2);
        let gains = 0;
        
        if (fund.hasReplace) {
          // 如果是实际净值
          gains = ((fund.dwjz - fund.dwjz / (1 + fund.gszzl * 0.01)) * num).toFixed(2);
        } else {
          // 如果是估算净值
          if (fund.gsz) {
            gains = ((fund.gsz - fund.dwjz) * num).toFixed(2);
          }
        }

        let costGains = 0;
        let costGainsRate = 0;
        if (cost && cost !== 0) {
          costGains = ((fund.dwjz - cost) * num).toFixed(2);
          costGainsRate = (((fund.dwjz - cost) / cost) * 100).toFixed(2);
        }

        return {
          ...fund,
          num,
          cost,
          amount,
          gains: parseFloat(gains),
          costGains: parseFloat(costGains),
          costGainsRate: parseFloat(costGainsRate)
        };
      });
    }

    return [];
  };

  // 重新加载数据
  const reloadData = async () => {
    const updatedFunds = await fetchUserFunds();
    setFunds(updatedFunds);
  };

  // 添加基金
  const addFund = async () => {
    if (!newFundCode.trim()) return;

    // 检查基金是否已存在
    const userFundsStr = localStorage.getItem('userFunds');
    const userFunds = userFundsStr ? JSON.parse(userFundsStr) : [];

    const exists = userFunds.some(f => f.code === newFundCode);
    if (exists) {
      alert('该基金已在列表中');
      return;
    }

    // 添加新基金到本地存储
    const newFund = {
      code: newFundCode,
      num: 0,
      cost: 0
    };

    userFunds.push(newFund);
    localStorage.setItem('userFunds', JSON.stringify(userFunds));

    // 重新加载数据
    await reloadData();

    // 重置表单
    setNewFundCode('');
    setShowAddForm(false);
    setSearchResults([]);
  };

  // 删除基金
  const deleteFund = async (fundcode) => {
    // 从本地存储中删除基金
    const userFundsStr = localStorage.getItem('userFunds');
    const userFunds = userFundsStr ? JSON.parse(userFundsStr) : [];

    const updatedFunds = userFunds.filter(f => f.code !== fundcode);
    localStorage.setItem('userFunds', JSON.stringify(updatedFunds));

    // 重新加载数据
    await reloadData();
  };

  // 更新基金持仓
  const updateFundHoldings = async (fundcode, field, value) => {
    const userFundsStr = localStorage.getItem('userFunds');
    const userFunds = userFundsStr ? JSON.parse(userFundsStr) : [];

    const fundIndex = userFunds.findIndex(f => f.code === fundcode);
    if (fundIndex !== -1) {
      userFunds[fundIndex][field] = parseFloat(value) || 0;
      localStorage.setItem('userFunds', JSON.stringify(userFunds));

      // 重新加载数据
      await reloadData();
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    const loadData = async () => {
      const userFunds = await fetchUserFunds();
      setFunds(userFunds);
    };

    loadData();

    // 设置定时器定期更新数据（仅在交易时间内）
    const interval = setInterval(() => {
      // 这里可以添加交易时间判断逻辑
      reloadData();
    }, 60000); // 每分钟更新一次

    return () => clearInterval(interval);
  }, []);

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
                {settings.showGSZ && <td>{fund.gsz?.toFixed(4)}</td>}
                <td>
                  {parseFloat(fund.amount).toLocaleString("zh", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                {settings.showCost && (
                  <td className={parseFloat(fund.costGains) >= 0 ? 'up' : 'down'}>
                    {parseFloat(fund.costGains).toLocaleString("zh", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                )}
                {settings.showCostRate && (
                  <td className={parseFloat(fund.costGainsRate) >= 0 ? 'up' : 'down'}>
                    {fund.cost > 0 ? `${fund.costGainsRate}%` : ""}
                  </td>
                )}
                <td className={parseFloat(fund.gszzl) >= 0 ? 'up' : 'down'}>
                  {parseFloat(fund.gszzl)}%
                </td>
                {settings.showGains && (
                  <td className={parseFloat(fund.gains) >= 0 ? 'up' : 'down'}>
                    {parseFloat(fund.gains).toLocaleString("zh", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                )}
                <td>
                  {fund.hasReplace 
                    ? fund.gztime?.substr(5, 5) 
                    : fund.gztime?.substr(10)
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