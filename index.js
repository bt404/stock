const request = require('request-promise');
const q = require('bluebird');
const sleep = require('sleep');

const SCHEMA = 'http://f10.eastmoney.com/CapitalStockStructure/CapitalStockStructureAjax?code=';
const THRESHOLD = 50;

async function get_restricted_ban_list (list) {
  const req_list = [];
  for (let stock_code of list) {
    const opts = {
      uri: `${SCHEMA}${stock_code}`,
      transform: (data) => {
        return {
          stock_code,
          data: data,
        };
      }
    };
    const temp = request(opts);
    req_list.push(temp);
  }
  

  let step = 50;
  for (let i = 0; i < req_list.length; i += step) {
    const ret = await q.all(req_list.slice(i, i + step));
    format_result(ret);
    sleep.sleep(5);
  }
}

function format_stock_code () {
  const ret = [];
  const prefix = ['SZ001', 'SZ001', 'SH601', 'SH603'];
  const make_surfix = () => {
    for (let i = 800; i < 1000; ++i) {
      for (let pre of prefix) {
        ret.push(`${pre}${String(i).padStart(3, '0')}`);
      }
    }
  };
  make_surfix();
  return ret;
}

function format_result (data) {
  const ret = [];
  for (let item of data) {
    let temp = JSON.parse(item.data);
    let ban_list = temp.RptRestrictedBanList || [];
    for (ban_item of ban_list) {
      let jjltbl = ban_item.jjltbl;
      jjltbl = Number(jjltbl.substr(0, jjltbl.length - 1));
      if (jjltbl > THRESHOLD) {
        ret.push({
          'code': item.stock_code,
          'ban_item': ban_item
        });
        // 只记录最近的一笔
        break;
      }
    }
  }
  console.log(ret);
  return ret;
}

function main () {
  get_restricted_ban_list(format_stock_code());
}

main()

