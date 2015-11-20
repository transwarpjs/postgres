
export default {

  hasTableSql: `
SELECT count(*)
  FROM INFORMATION_SCHEMA.tables
  WHERE table_name = $1
  AND table_type = 'BASE TABLE'`,

  currentDatabaseSql: 'SELECT CURRENT_DATABASE()',

  select(columns, nostar) {
    const str = columns.join(', ')
    if (nostar) return str
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
      if (operator === 'in') {
        arr.push(`(${value})`)
      } else {
        arr.push(value)
      }
      return `${column} ${operator.toUpperCase()} $${++i}`
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

  returning(columns, nostar) {
    const str = this.select(columns, nostar)
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
  },

  insert(columns, arr, args) {
    var i = arr.length
    const keys = Object.keys(columns)
    const str = keys.map(k => {
      arr.push(columns[k])
      args.push(`$${++i}`)
      return k
    }).join(', ')
    return str.length ? `(${str})` : ''
  }

}
