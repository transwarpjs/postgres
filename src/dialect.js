
export default {

  hasTableSql: `
SELECT count(*)
  FROM INFORMATION_SCHEMA.tables
  WHERE table_name = $1
  AND table_type = 'BASE TABLE'`,

  currentDatabaseSql: 'SELECT CURRENT_DATABASE()',

  select(columns) {
    const str = columns.join(', ')
    return str || '*'
  },

  limit(n) {
    return n >= 0 ? ` LIMIT ${n}` : ''
  },

  skip(n) {
    return n >= 0 ? ` OFFSET ${n}` : ''
  },

  where(conditions, arr) {
    var i = arr.length
    const str = conditions.map(c => {
      const { column, operator, value } = c
      arr.push(value)
      return `${column} ${operator} $${++i}`
    })
    return str.length ? ` WHERE ${str}` : ''
  },

  sort(orders) {
    const str = orders.map(field => {
      const [column, flag] = field
      return `${column} ${flag || ''}`.trimRight()
    }).join(', ')
    return str.length ? ` ORDER BY ${str}` : ''
  },

  group(columns) {
    const str = columns.join(', ')
    return str.length ? ` ORDER BY ${str}` : ''
  },

  returning(columns) {
    const str = this.select(columns)
    return str.length ? ` RETURNING ${str}` : ''
  },

  set(columns, arr) {
    var i = arr.length
    const keys = Object.keys(columns)
    const str = keys.map(k => {
      arr.push(columns[k])
      return `${k} = $${++i}`
    }).join(', ')
    return str
  }

}
