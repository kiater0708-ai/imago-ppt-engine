// 填写完整性检查（程序判定，不调模型）：按版式的填写契约逐页核对 props。
// 只读 fillPlan / countBindings / decorativeKeys，不放宽也不改契约。
// 每条问题：{ index, layout, field, code, message }，code 取 MISSING_FIELD / BAD_ARRAY_COUNT / OUT_OF_RANGE。
import { getByPath } from './residue.mjs';

const SKIP_TEXT_KEYS = new Set(['imagePlaceholder']); // 本次不放图，契约里也不给

function isEmptyValue(value) {
  return value === undefined || value === null || (typeof value === 'string' && !value.trim());
}

function topArrays(info) {
  return (info.fillPlan.arrays || []).filter(array => !String(array.key).includes('[]'));
}

/** 补写缺失的数量字段（项数合法但没写 countKey 时按项数补）。直接改 props，返回补写说明。 */
export function fillMissingCountKeys(props, info) {
  const notes = [];
  for (const array of topArrays(info)) {
    if (!array.countKey) continue;
    const value = getByPath(props, array.key);
    if (Array.isArray(value) && value.length >= 1 && isEmptyValue(props[array.countKey])) {
      props[array.countKey] = value.length;
      notes.push(`${array.countKey} = ${value.length}`);
    }
  }
  return notes;
}

/** 返回该页的完整性问题（数组，空数组表示通过）。 */
export function checkSlideCompleteness(props, info) {
  const errors = [];
  const add = (code, field, message) => errors.push({ code, field, message });
  if (!props || typeof props !== 'object' || Array.isArray(props)) return [{ code: 'MISSING_FIELD', field: null, message: 'props 不是对象' }];
  const decorative = new Set(info.decorativeKeys || []);
  const mediaFields = new Set((info.mediaSlots || []).map(slot => slot.field));

  for (const field of info.fillPlan.text) {
    if (SKIP_TEXT_KEYS.has(field.key) || decorative.has(field.key) || mediaFields.has(field.key)) continue;
    const value = getByPath(props, field.key);
    const flatKey = field.key.includes('.') && props[field.key] !== undefined;
    if (flatKey) add('MISSING_FIELD', field.key, `字段 ${field.key} 写成了带点的扁平键；应写成嵌套对象 ${field.key.split('.')[0]}: { ${field.key.split('.').slice(1).join('.')}: … }`);
    else if (isEmptyValue(value)) add('MISSING_FIELD', field.key, `缺少文本字段 ${field.key}（或为空）`);
    else if (field.type === 'number' && typeof value !== 'number') add('MISSING_FIELD', field.key, `字段 ${field.key} 应为数字，实际 ${typeof value}`);
    else if (field.type === 'string' && typeof value !== 'string') add('MISSING_FIELD', field.key, `字段 ${field.key} 应为字符串，实际 ${typeof value}`);
  }

  for (const array of topArrays(info)) {
    if (decorative.has(array.key) || mediaFields.has(array.key)) continue;
    const value = getByPath(props, array.key);
    if (!Array.isArray(value)) {
      add('MISSING_FIELD', array.key, `缺少数组字段 ${array.key}${array.key.includes('.') ? '（含「.」的是嵌套对象路径）' : ''}`);
      continue;
    }
    const max = array.maxCount ?? array.visibleCount;
    if (value.length < 1 || value.length > max) add('BAD_ARRAY_COUNT', array.key, `数组 ${array.key} 项数 ${value.length} 不在 1–${max} 内`);
    if (array.countKey) {
      const count = props[array.countKey];
      if (!isEmptyValue(count) && count !== value.length) add('BAD_ARRAY_COUNT', array.countKey, `数量字段 ${array.countKey}=${count} 与数组 ${array.key} 的项数 ${value.length} 不一致`);
      const binding = (info.countBindings || []).find(item => item.key === array.countKey);
      if (binding && (value.length < binding.min || value.length > binding.max)) add('BAD_ARRAY_COUNT', array.key, `数组 ${array.key} 项数 ${value.length} 超出数量范围 ${binding.min}–${binding.max}（${array.countKey}）`);
    }
    value.forEach((item, index) => {
      const tag = `${array.key}[${index}]`;
      if (array.itemFields) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          add('MISSING_FIELD', tag, `${tag} 应为对象`);
          return;
        }
        for (const [name, field] of Object.entries(array.itemFields)) {
          const cell = item[name];
          if (isEmptyValue(cell)) {
            add('MISSING_FIELD', `${tag}.${name}`, `${tag} 缺少字段 ${name}（或为空）`);
            continue;
          }
          if (field.type === 'number') {
            if (typeof cell !== 'number' || !Number.isFinite(cell)) {
              add('MISSING_FIELD', `${tag}.${name}`, `${tag}.${name} 应为数字，实际 ${JSON.stringify(cell)}`);
              continue;
            }
            const bounds = field.numericBounds;
            if (bounds?.enforced && (cell < bounds.min || cell > bounds.max)) {
              add('OUT_OF_RANGE', `${tag}.${name}`, `${tag}.${name}=${cell} 超出硬限制 ${bounds.min}–${bounds.max}${bounds.semantics ? `（${bounds.semantics}）` : ''}`);
            }
          }
        }
        for (const [name, nested] of Object.entries(array.nestedArrays || {})) {
          const inner = item[name];
          if (!Array.isArray(inner)) {
            add('MISSING_FIELD', `${tag}.${name}`, `${tag} 缺少嵌套数组 ${name}`);
          } else if (nested.fixedLength && inner.length !== nested.fixedLength) {
            add('BAD_ARRAY_COUNT', `${tag}.${name}`, `${tag}.${name} 长度 ${inner.length} ≠ 定长 ${nested.fixedLength}`);
          } else if (inner.some(cell => typeof cell !== 'number' || !Number.isFinite(cell))) {
            add('OUT_OF_RANGE', `${tag}.${name}`, `${tag}.${name} 含非数字元素`);
          }
        }
      } else if (array.itemShape === 'string') {
        if (typeof item !== 'string' || !item.trim()) add('MISSING_FIELD', tag, `${tag} 应为非空字符串`);
      } else if (array.itemShape === 'number') {
        if (typeof item !== 'number' || !Number.isFinite(item)) add('MISSING_FIELD', tag, `${tag} 应为数字`);
      }
    });
  }

  // navCurrent 是 navItems 的下标
  if (typeof props.navCurrent === 'number' && Array.isArray(props.navItems) && (props.navCurrent < 0 || props.navCurrent >= props.navItems.length)) {
    add('OUT_OF_RANGE', 'navCurrent', `navCurrent=${props.navCurrent} 超出 navItems 长度 ${props.navItems.length}`);
  }
  return errors;
}

/**
 * 整份 goal 的完整性检查：先补写 countKey（改传入的 goal 对象），再逐页检查。
 * 返回 { errors:[{index,layout,field,code,message}], filled:[{index,layout,notes}] }
 */
export function checkGoalCompleteness(goal, infos) {
  const errors = [];
  const filled = [];
  goal.slides.forEach((slide, index) => {
    const info = infos.get(slide.layout);
    if (!info) return; // 版式不存在由 validate-goal-spec 报（unknown layout），这里不重复
    const notes = fillMissingCountKeys(slide.props || {}, info);
    if (notes.length) filled.push({ index, layout: slide.layout, notes });
    for (const item of checkSlideCompleteness(slide.props, info)) errors.push({ index, layout: slide.layout, ...item });
  });
  return { errors, filled };
}
