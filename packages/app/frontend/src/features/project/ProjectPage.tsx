import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import {
  Connection,
  Edge,
  Node,
  NodeChange,
  addEdge,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import { FlowCanvas, BlockPanel, PropertyPanel } from '@flowcamel/designer';
import type { BlockDefinition, FlowEdge, FlowGraph, FlowNode } from '@flowcamel/core';
import { getBlock, orderedNodesFromGraph, validate, validateForYamlExport } from '@flowcamel/core';
import { useProjectStore } from './ProjectStore.js';
import { StatusBar } from './StatusBar.js';
import { ConfigModal } from './ConfigModal.js';
import { GenerateModal } from './GenerateModal.js';
import { TestRunDrawer } from './TestRunDrawer.js';
import type { LogEntry } from './TestRunDrawer.js';
import { getProject, stopTestRun as stopTestRunApi, streamTestRun, updateProject } from '../../api/backendClient.js';
import { useAppStore } from '../../stores/appStore.js';
import { syncGraphFromCanvas } from './syncGraphFromCanvas.js';

function deriveSubtitle(blockType: string, props: Record<string, string>): string {
  switch (blockType) {
    case 'sftp-source': return props['host'] || '';
    case 'timer-source': return props['period'] ? `every ${props['period']}` : '';
    case 'http-source': return props['path'] || '';
    case 'filter-action': return props['expression'] ? props['expression'].slice(0, 24) : '';
    case 'transform-action': return props['from'] && props['to'] ? `${props['from']} → ${props['to']}` : '';
    case 'set-body-action': return props['expression'] ? props['expression'].slice(0, 24) : '';
    case 'log-action': return props['level'] ? `${props['level']} level` : '';
    case 'log-dest': return props['loggerName'] ? `logger: ${props['loggerName']}` : '';
    case 'email-dest': return props['to'] || '';
    case 'db-dest': return props['table'] || '';
    case 'kafka-dest':
    case 'kafka-source':
      return props['topic'] || '';
    case 'http-dest':
      return props['url'] ? props['url'].replace(/^https?:\/\//, '').slice(0, 22) : '';
    default:
      return '';
  }
}

function nodeData(
  n: FlowNode,
  nodeStyle: 'card' | 'minimal',
  opts?: { pulse?: boolean }
) {
  return {
    blockType: n.blockType,
    label: n.label,
    subtitle: n.subtitle ?? deriveSubtitle(n.blockType, n.props),
    props: n.props,
    nodeStyle,
    pulse: opts?.pulse ?? false,
  };
}

function ts(): string {
  const d = new Date();
  return (
    d.toLocaleTimeString('en-US', { hour12: false }) +
    '.' +
    String(d.getMilliseconds()).padStart(3, '0')
  );
}

export function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const store = useProjectStore();
  const notify = useAppStore((s) => s.notify);
  const isDirty = useProjectStore((s) => s.isDirty);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const nodeStyle = 'card' as const;
  const [configFor, setConfigFor] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [graphForGenerate, setGraphForGenerate] = useState<FlowGraph | null>(null);
  const [showTestRun, setShowTestRun] = useState(false);
  const [testRunning, setTestRunning] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [testRunYaml, setTestRunYaml] = useState<string | undefined>();

  const [draggingBlock, setDraggingBlock] = useState<BlockDefinition | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);
  const [dropActive, setDropActive] = useState(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const draggingBlockRef = useRef<BlockDefinition | null>(null);
  const testRunAbortRef = useRef<AbortController | null>(null);
  draggingBlockRef.current = draggingBlock;

  const liveGraph = useMemo(
    () => syncGraphFromCanvas(store.graph, nodes, edges),
    [store.graph, nodes, edges]
  );
  const validation = validate(liveGraph);
  const graphValid = validation.valid;
  const yamlExportValidation = validateForYamlExport(liveGraph);

  useEffect(() => {
    return () => {
      testRunAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    getProject(id).then((meta) => {
      store.loadGraph(meta.graph);
      setNodes(
        meta.graph.nodes.map((n: FlowNode) => ({
          id: n.id,
          type: 'flowNode',
          position: n.position ?? { x: 0, y: 0 },
          data: nodeData(n, nodeStyle),
        }))
      );
      setEdges(
        meta.graph.edges.map((e: FlowEdge) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: 'flowEdge',
        }))
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      for (const change of changes) {
        if (change.type === 'position' && change.position && change.dragging === false) {
          store.updateNodePosition(change.id, change.position);
        }
      }
    },
    [onNodesChange, store]
  );

  useEffect(() => {
    if (!draggingBlock) return;
    const move = (e: MouseEvent) => {
      setGhost({ x: e.clientX, y: e.clientY });
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const over =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom;
        setDropActive(over);
      }
    };
    const up = (e: MouseEvent) => {
      const block = draggingBlockRef.current;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (
        block &&
        rect &&
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const position = {
          x: Math.max(20, e.clientX - rect.left - 78),
          y: Math.max(20, e.clientY - rect.top - 43),
        };
        const newNode = store.addNode(block.type, position);
        setNodes((nds) => [
          ...nds,
          {
            id: newNode.id,
            type: 'flowNode',
            position,
            data: nodeData(newNode, nodeStyle),
          },
        ]);
        store.setSelectedNode(newNode.id);
      }
      setDraggingBlock(null);
      setGhost(null);
      setDropActive(false);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [draggingBlock, nodeStyle, setNodes, store]);

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: FlowEdge = {
        id: `${connection.source}-${connection.target}`,
        source: connection.source ?? '',
        target: connection.target ?? '',
      };
      store.addEdge(edge);
      setEdges((eds: Edge[]) => addEdge({ ...connection, type: 'flowEdge' }, eds));
    },
    [store, setEdges]
  );

  function onSidebarDragStart(block: BlockDefinition, clientX: number, clientY: number) {
    setDraggingBlock(block);
    setGhost({ x: clientX, y: clientY });
    setDropActive(false);
  }

  function onNodeClick(_event: React.MouseEvent, node: Node) {
    store.setSelectedNode(node.id);
  }

  function onNodeDoubleClick(_event: React.MouseEvent, node: Node) {
    setConfigFor(node.id);
  }

  const selectedNode: FlowNode | null =
    store.graph.nodes.find((n: FlowNode) => n.id === store.selectedNodeId) ?? null;

  function handleNodeUpdate(nodeId: string, props: Record<string, string>) {
    store.updateNodeProps(nodeId, props);
    const blockType = store.graph.nodes.find((n) => n.id === nodeId)?.blockType ?? '';
    const subtitle = deriveSubtitle(blockType, props);
    if (subtitle) store.updateNodeSubtitle(nodeId, subtitle);
    setNodes((nds: Node[]) =>
      nds.map((n: Node) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, props, subtitle: subtitle || n.data.subtitle } }
          : n
      )
    );
  }

  function handleConfigSave(patch: {
    label: string;
    subtitle: string;
    props: Record<string, string>;
  }) {
    if (!configFor) return;
    store.updateNodeProps(configFor, patch.props);
    store.updateNodeSubtitle(configFor, patch.subtitle);
    setNodes((nds: Node[]) =>
      nds.map((n: Node) =>
        n.id === configFor
          ? {
              ...n,
              data: {
                ...n.data,
                label: patch.label,
                subtitle: patch.subtitle,
                props: patch.props,
              },
            }
          : n
      )
    );
    setConfigFor(null);
  }

  function onCreateFlow(prompt: string) {
    const lower = prompt.toLowerCase();
    const seq: string[] = [];
    if (/sftp|files|partner/.test(lower)) seq.push('sftp-source');
    else if (/http|webhook|post|api/.test(lower)) seq.push('http-source');
    else if (/timer|every|morning|schedule|minute/.test(lower)) seq.push('timer-source');
    else if (/kafka.*event|kafka.*topic.*read|consume|kafka consumer/.test(lower))
      seq.push('kafka-source');
    else seq.push('sftp-source');

    if (/filter|only|pick/.test(lower)) seq.push('filter-action');
    if (/transform|json|xml|convert/.test(lower)) seq.push('transform-action');
    if (/set body|setbody|replace body|payload/.test(lower)) seq.push('set-body-action');
    if (/split|each|per/.test(lower)) seq.push('split-action');

    if (/email|alert|notify|ops/.test(lower)) seq.push('email-dest');
    else if (/log/.test(lower)) seq.push('log-dest');
    else if (/database|save|store/.test(lower)) seq.push('db-dest');
    else if (/kafka/.test(lower)) seq.push('kafka-dest');
    else seq.push('log-dest');

    const baseX = 80;
    const stepX = 200;
    const y = 150;
    const addedNodes = seq.map((blockType, i) =>
      store.addNode(blockType, { x: baseX + i * stepX, y })
    );
    setNodes((nds: Node[]) => [
      ...nds,
      ...addedNodes.map((n: FlowNode, i: number) => ({
        id: n.id,
        type: 'flowNode',
        position: { x: baseX + i * stepX, y },
        data: nodeData(n, nodeStyle),
      })),
    ]);

    for (let i = 0; i < addedNodes.length - 1; i++) {
      const fromNode = addedNodes[i];
      const toNode = addedNodes[i + 1];
      if (!fromNode || !toNode) continue;
      const edge: FlowEdge = {
        id: `${fromNode.id}-${toNode.id}`,
        source: fromNode.id,
        target: toNode.id,
      };
      store.addEdge(edge);
      setEdges((eds: Edge[]) =>
        addEdge({ id: edge.id, source: edge.source, target: edge.target, type: 'flowEdge' }, eds)
      );
    }

    const firstAdded = addedNodes[0];
    if (firstAdded) store.setSelectedNode(firstAdded.id);
  }

  function applyTestVisuals(step: number | null, ordered: FlowNode[]) {
    const orderById = Object.fromEntries(ordered.map((n, i) => [n.id, i]));
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          pulse: step !== null && orderById[n.id] === step,
        },
      }))
    );
    setEdges((eds) =>
      eds.map((e) => {
        const srcOrder = orderById[e.source];
        const tgtOrder = orderById[e.target];
        const flowing =
          step !== null &&
          srcOrder !== undefined &&
          tgtOrder !== undefined &&
          tgtOrder <= step;
        return {
          ...e,
          data: { ...(e.data as object), flowing },
        };
      })
    );
  }

  function openTestRunLogs() {
    setShowTestRun(true);
  }

  async function stopTestRun() {
    if (!id) return;
    testRunAbortRef.current?.abort();
    try {
      await stopTestRunApi(id);
    } catch {
      /* stream may already be closed */
    }
    setLogs((prev) => [
      ...prev,
      { time: ts(), level: 'warn', msg: '[flowcamel] Test run stopped by user.' },
    ]);
    setTestRunning(false);
    applyTestVisuals(null, store.graph.nodes);
  }

  async function startTestRun() {
    if (!id) return;

    const graph = getSyncedGraph();
    const yamlCheck = validateForYamlExport(graph);
    if (!yamlCheck.valid) {
      notify('error', yamlCheck.errors[0] ?? 'Fix validation errors before test run.');
      return;
    }

    testRunAbortRef.current?.abort();
    const abort = new AbortController();
    testRunAbortRef.current = abort;

    const orderedNodes = orderedNodesFromGraph(graph);
    setShowTestRun(true);
    setLogs([]);
    setTestRunYaml(undefined);
    setTestRunning(true);
    applyTestVisuals(-1, orderedNodes);

    try {
      await updateProject(id, { name: graph.name, graph });

      await streamTestRun(id, (event) => {
        if (event.type === 'yaml') {
          setTestRunYaml(event.content);
          setLogs((prev) => [
            ...prev,
            {
              time: ts(),
              level: 'info',
              msg: '[flowcamel] Generated routes.camel.yaml — starting Camel JBang run',
            },
          ]);
        } else if (event.type === 'log') {
          setLogs((prev) => [
            ...prev,
            {
              time: event.time,
              level: event.level,
              msg: event.msg,
            },
          ]);
        } else if (event.type === 'error') {
          setLogs((prev) => [
            ...prev,
            { time: ts(), level: 'err', msg: event.message },
          ]);
        } else if (event.type === 'done') {
          setLogs((prev) => [
            ...prev,
            {
              time: ts(),
              level: event.exitCode === 0 ? 'info' : 'err',
              msg: `[flowcamel] Test run finished (exit ${event.exitCode}, ${event.durationMs}ms)`,
            },
          ]);
        }
      }, abort.signal);
    } catch (err) {
      if (abort.signal.aborted) {
        return;
      }
      const msg = err instanceof Error ? err.message : 'Test run failed';
      setLogs((prev) => [...prev, { time: ts(), level: 'err', msg }]);
      notify('error', msg.split('\n')[0] ?? msg);
    } finally {
      if (testRunAbortRef.current === abort) {
        testRunAbortRef.current = null;
      }
      setTestRunning(false);
      applyTestVisuals(null, orderedNodes);
    }
  }

  function getSyncedGraph() {
    return syncGraphFromCanvas(store.graph, nodes, edges);
  }

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      const graph = getSyncedGraph();
      const updated = await updateProject(id, { name: graph.name, graph });
      store.loadGraph(updated.graph);
      notify('success', 'Project saved.');
    } catch {
      notify('error', 'Failed to save project.');
    } finally {
      setSaving(false);
    }
  }

  function openGenerate() {
    const graph = getSyncedGraph();
    store.loadGraph(graph);
    setGraphForGenerate(graph);
    setShowGenerate(true);
  }

  const configNode = configFor ? store.graph.nodes.find((n) => n.id === configFor) : null;
  const configBlock = configNode ? getBlock(configNode.blockType) : null;

  if (!id) {
    return (
      <div style={{ padding: 24, color: 'var(--color-text-tertiary)' }}>No project selected.</div>
    );
  }

  return (
    <div className="fc-project-page">
      <div className="topbar">
        <Link to="/" className="logo">
          <span className="logo-mark">
            <i className="ti ti-route" />
          </span>
          Flow<span className="logo-camel">Camel</span>
        </Link>
        <input
          className="project-name"
          value={store.graph.name}
          onChange={(e) => store.setGraphName(e.target.value)}
          placeholder="Flow name"
          spellCheck={false}
        />
        <div className="topbar-right">
          {isDirty && (
            <button className="btn btn-sm" onClick={handleSave} disabled={saving}>
              <i className="ti ti-device-floppy" /> {saving ? 'Saving…' : 'Save'}
            </button>
          )}
          {testRunning ? (
            <>
              <button
                className="btn btn-sm test-run-stop"
                onClick={stopTestRun}
                title="Stop test run (kills JBang/Docker — same as Karavan Stop)"
              >
                <i className="ti ti-player-stop-filled" /> Stop
              </button>
              <button
                className="btn btn-sm"
                onClick={openTestRunLogs}
                title="Reopen the log drawer for the current test run"
              >
                <i className="ti ti-terminal-2" /> View logs
              </button>
            </>
          ) : (
            <button
              className="btn btn-sm"
              onClick={startTestRun}
              disabled={!yamlExportValidation.valid}
              title={
                !yamlExportValidation.valid
                  ? yamlExportValidation.errors.join('\n')
                  : 'Run generated Camel YAML via JBang (dev mode)'
              }
            >
              <i className="ti ti-player-play" /> Test run
            </button>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={openGenerate}
            disabled={!graphValid}
            title={!graphValid ? validation.errors.join('\n') : 'Download Spring Boot ZIP'}
          >
            <i className="ti ti-package-export" /> Generate project
          </button>
        </div>
      </div>

      <PanelGroup direction="horizontal" className="fc-panels" style={{ flex: 1, overflow: 'hidden' }}>
        <Panel defaultSize={18} minSize={14} className="fc-panel">
          <BlockPanel
            onSidebarDragStart={onSidebarDragStart}
            draggingBlockType={draggingBlock?.type ?? null}
          />
        </Panel>
        <PanelResizeHandle className="fc-resize-handle" />
        <Panel className="fc-panel" style={{ position: 'relative' }}>
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            dropActive={dropActive}
            canvasRef={canvasRef}
          />
          {testRunning && !showTestRun && (
            <button
              type="button"
              className="test-run-pill"
              onClick={openTestRunLogs}
              title="Show logs for the running test (no new Docker container)"
            >
              <i className="ti ti-terminal-2" /> View logs
            </button>
          )}
          {showTestRun && (
            <TestRunDrawer
              logs={logs}
              isRunning={testRunning}
              yamlPreview={testRunYaml}
              onClose={() => {
                setShowTestRun(false);
                if (!testRunning) {
                  applyTestVisuals(null, store.graph.nodes);
                }
              }}
              onReplay={startTestRun}
              onStop={stopTestRun}
            />
          )}
        </Panel>
        <PanelResizeHandle className="fc-resize-handle" />
        <Panel defaultSize={24} minSize={18} className="fc-panel">
          <PropertyPanel
            node={selectedNode}
            allNodes={store.graph.nodes}
            onNodeUpdate={handleNodeUpdate}
            onOpenConfig={() => selectedNode && setConfigFor(selectedNode.id)}
            onCreateFlow={onCreateFlow}
          />
        </Panel>
      </PanelGroup>

      <StatusBar graph={liveGraph} />

      {ghost && draggingBlock && (
        <div className="drag-ghost" style={{ left: ghost.x, top: ghost.y }}>
          <div className="fc-ghost-node">
            <div className="fc-ghost-node__row">
              <div
                className={`fc-flow-node__icon fc-flow-node__icon--${draggingBlock.category}`}
              >
                <i className={`ti ${draggingBlock.icon}`} />
              </div>
              <div>
                <div className="fc-flow-node__label">{draggingBlock.label}</div>
                <div className="fc-flow-node__subtitle">{draggingBlock.short}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {configNode && configBlock && (
        <ConfigModal
          node={configNode}
          block={configBlock}
          onClose={() => setConfigFor(null)}
          onSave={handleConfigSave}
          onDelete={() => {
            if (!configFor) return;
            store.removeNode(configFor);
            setNodes((nds) => nds.filter((n) => n.id !== configFor));
            setEdges((eds) =>
              eds.filter((e) => e.source !== configFor && e.target !== configFor)
            );
          }}
        />
      )}

      {showGenerate && graphForGenerate && (
        <GenerateModal
          projectId={id}
          graph={graphForGenerate}
          onClose={() => {
            setShowGenerate(false);
            setGraphForGenerate(null);
          }}
          onSaved={(graph) => store.loadGraph(graph)}
        />
      )}
    </div>
  );
}
