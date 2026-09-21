/**
 * 테스트용 인메모리 DynamoDB DocumentClient 흉내
 * (이 Lambda 가 사용하는 Put/Get/Query/Scan/Update/Delete 와 UpdateExpression 패턴만 지원)
 */
const {
  PutCommand, GetCommand, QueryCommand, ScanCommand, UpdateCommand, DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');

function resolveName(token, names) {
  return token.startsWith('#') ? names[token] : token;
}

function applyUpdate(item, cmd) {
  const { UpdateExpression, ExpressionAttributeNames = {}, ExpressionAttributeValues = {} } = cmd;
  const setPart = UpdateExpression.replace(/^SET\s+/i, '');
  // 콤마 분리 (함수 괄호 안의 콤마는 무시)
  const assignments = [];
  let depth = 0, cur = '';
  for (const ch of setPart) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { assignments.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) assignments.push(cur.trim());

  for (const a of assignments) {
    const [lhs, rhs] = a.split('=').map((s) => s.trim());
    const attr = resolveName(lhs, ExpressionAttributeNames);
    const la = rhs.match(/^list_append\(if_not_exists\((#?\w+),\s*(:\w+)\),\s*(:\w+)\)$/);
    if (la) {
      const existing = item[resolveName(la[1], ExpressionAttributeNames)] ?? ExpressionAttributeValues[la[2]];
      item[attr] = [...existing, ...ExpressionAttributeValues[la[3]]];
    } else if (rhs.startsWith(':')) {
      item[attr] = ExpressionAttributeValues[rhs];
    } else {
      throw new Error(`unsupported update rhs: ${rhs}`);
    }
  }
}

function createFakeDb(seed = {}) {
  const tables = {};
  for (const [t, items] of Object.entries(seed)) tables[t] = new Map(items.map((i) => [i.requestId ?? i.userId, i]));
  const table = (name) => { if (!tables[name]) tables[name] = new Map(); return tables[name]; };
  const keyOf = (Key) => Object.values(Key)[0];

  return {
    tables,
    async send(cmd) {
      const input = cmd.input;
      if (cmd instanceof PutCommand) {
        const t = table(input.TableName);
        const k = input.Item.requestId ?? input.Item.userId;
        if (input.ConditionExpression?.includes('attribute_not_exists') && t.has(k)) {
          const e = new Error('conditional failed'); e.name = 'ConditionalCheckFailedException'; throw e;
        }
        t.set(k, JSON.parse(JSON.stringify(input.Item)));
        return {};
      }
      if (cmd instanceof GetCommand) {
        const it = table(input.TableName).get(keyOf(input.Key));
        return { Item: it ? JSON.parse(JSON.stringify(it)) : undefined };
      }
      if (cmd instanceof QueryCommand) {
        if (input.IndexName && input.IndexName !== 'userId-createdAt-index') throw new Error('index missing');
        const u = input.ExpressionAttributeValues[':u'];
        const items = [...table(input.TableName).values()].filter((i) => i.userId === u)
          .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        return { Items: JSON.parse(JSON.stringify(items)) };
      }
      if (cmd instanceof ScanCommand) {
        let items = [...table(input.TableName).values()];
        if (input.FilterExpression) {
          const [lhs, , rhsTok] = input.FilterExpression.split(/\s+/);
          const attr = resolveName(lhs, input.ExpressionAttributeNames || {});
          items = items.filter((i) => i[attr] === input.ExpressionAttributeValues[rhsTok]);
        }
        return { Items: JSON.parse(JSON.stringify(items)) };
      }
      if (cmd instanceof UpdateCommand) {
        const t = table(input.TableName);
        const k = keyOf(input.Key);
        const it = t.get(k) || { ...input.Key };
        applyUpdate(it, input);
        t.set(k, it);
        return { Attributes: JSON.parse(JSON.stringify(it)) };
      }
      if (cmd instanceof DeleteCommand) {
        table(input.TableName).delete(keyOf(input.Key));
        return {};
      }
      throw new Error(`unsupported command ${cmd.constructor.name}`);
    },
  };
}

module.exports = { createFakeDb };
