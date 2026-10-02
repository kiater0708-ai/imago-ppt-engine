// 2026-10-02 X99 真机：宿主（绘境）的启动器已退出，它的 PID 被浏览器任务里的新进程复用，
// descendantsOf 把宿主算成新进程的子进程，任务收尾时 taskkill /T /F 连宿主一起杀掉。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { descendantsOf } from '../app/lib/procs.mjs';

const at = s => `2026-10-02T10:${s}.0000000Z`;

test('父进程 PID 被复用：比「父进程」启动得早的进程不算后代（Windows CIM 时间格式）', () => {
  const rows = [
    { pid: 100, ppid: 1, start: at('24:10'), command: 'imago.exe' },        // 宿主，原父进程（启动器）PID 4321 已退出
    { pid: 200, ppid: 100, start: at('26:00'), command: 'node.exe cli.mjs' }, // 插件
    { pid: 300, ppid: 200, start: at('29:02'), command: 'node.exe worker' },  // 浏览器任务
    { pid: 4321, ppid: 300, start: at('29:03'), command: 'powershell.exe' },  // 复用了启动器 PID 的新进程
    { pid: 500, ppid: 4321, start: at('29:04'), command: 'conhost.exe' },     // 真正的孙进程
  ];
  rows.push({ pid: 100, ppid: 4321, start: at('24:10'), command: 'imago.exe' }); // 宿主：父 PID 指向复用号
  rows.shift();
  const pids = descendantsOf(300, rows).map(row => row.pid).sort((a, b) => a - b);
  assert.deepEqual(pids, [500, 4321], '宿主 100 与它的子进程 200 都不能被算进来');
  assert.ok(!descendantsOf(200, rows).some(row => row.pid === 100), '插件自己的后代里也不能有宿主');
});

test('POSIX lstart 格式同样生效；同一秒启动的子进程仍算后代', () => {
  const rows = [
    { pid: 10, ppid: 1, start: 'Thu Oct  2 18:29:00 2026', command: 'worker' },
    { pid: 11, ppid: 10, start: 'Thu Oct  2 18:29:00 2026', command: 'chrome' },
    { pid: 12, ppid: 10, start: 'Thu Oct  2 18:20:00 2026', command: 'old-host' },
  ];
  assert.deepEqual(descendantsOf(10, rows).map(row => row.pid), [11]);
});

test('启动时间缺失时不做排除（与原行为一致）', () => {
  const rows = [
    { pid: 10, ppid: 1, start: '', command: 'worker' },
    { pid: 11, ppid: 10, start: at('00:00'), command: 'a' },
    { pid: 12, ppid: 11, start: '', command: 'b' },
  ];
  assert.deepEqual(descendantsOf(10, rows).map(row => row.pid), [11, 12]);
});
