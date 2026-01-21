import { useState, useCallback, useMemo, createContext, useContext, ReactNode } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  MoreHorizontal,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
  icon?: ReactNode;
  data?: unknown;
  disabled?: boolean;
}

interface TreeViewContextValue {
  selectedIds: string[];
  expandedIds: string[];
  onSelect: (id: string, multiSelect?: boolean) => void;
  onToggle: (id: string) => void;
  onNodeAction?: (action: string, node: TreeNode) => void;
  showActions?: boolean;
  showCheckboxes?: boolean;
  editable?: boolean;
}

const TreeViewContext = createContext<TreeViewContextValue | null>(null);

// TreeView Component
interface TreeViewProps {
  data: TreeNode[];
  selectedIds?: string[];
  expandedIds?: string[];
  onSelect?: (ids: string[]) => void;
  onExpand?: (ids: string[]) => void;
  onNodeAction?: (action: string, node: TreeNode) => void;
  multiSelect?: boolean;
  showActions?: boolean;
  showCheckboxes?: boolean;
  editable?: boolean;
  defaultExpandAll?: boolean;
  defaultCollapseAll?: boolean;
  className?: string;
  emptyMessage?: string;
}

export function TreeView({
  data,
  selectedIds: controlledSelectedIds,
  expandedIds: controlledExpandedIds,
  onSelect,
  onExpand,
  onNodeAction,
  multiSelect = false,
  showActions = false,
  showCheckboxes = false,
  editable = false,
  defaultExpandAll = false,
  defaultCollapseAll = false,
  className,
  emptyMessage = 'Nenhum item encontrado',
}: TreeViewProps) {
  // Get all node IDs for default expand
  const getAllNodeIds = useCallback((nodes: TreeNode[]): string[] => {
    const ids: string[] = [];
    const traverse = (nodeList: TreeNode[]) => {
      nodeList.forEach((node) => {
        ids.push(node.id);
        if (node.children) {
          traverse(node.children);
        }
      });
    };
    traverse(nodes);
    return ids;
  }, []);

  const defaultExpanded = useMemo(() => {
    if (defaultExpandAll) return getAllNodeIds(data);
    if (defaultCollapseAll) return [];
    return [];
  }, [data, defaultExpandAll, defaultCollapseAll, getAllNodeIds]);

  // State
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const [internalExpandedIds, setInternalExpandedIds] = useState<string[]>(defaultExpanded);

  const selectedIds = controlledSelectedIds ?? internalSelectedIds;
  const expandedIds = controlledExpandedIds ?? internalExpandedIds;

  // Handle selection
  const handleSelect = useCallback(
    (id: string, isMultiSelect?: boolean) => {
      let newSelectedIds: string[];

      if (multiSelect && isMultiSelect) {
        if (selectedIds.includes(id)) {
          newSelectedIds = selectedIds.filter((s) => s !== id);
        } else {
          newSelectedIds = [...selectedIds, id];
        }
      } else {
        newSelectedIds = selectedIds.includes(id) && selectedIds.length === 1 ? [] : [id];
      }

      if (onSelect) {
        onSelect(newSelectedIds);
      } else {
        setInternalSelectedIds(newSelectedIds);
      }
    },
    [selectedIds, multiSelect, onSelect]
  );

  // Handle expand/collapse
  const handleToggle = useCallback(
    (id: string) => {
      const newExpandedIds = expandedIds.includes(id)
        ? expandedIds.filter((e) => e !== id)
        : [...expandedIds, id];

      if (onExpand) {
        onExpand(newExpandedIds);
      } else {
        setInternalExpandedIds(newExpandedIds);
      }
    },
    [expandedIds, onExpand]
  );

  // Expand all
  const expandAll = useCallback(() => {
    const allIds = getAllNodeIds(data);
    if (onExpand) {
      onExpand(allIds);
    } else {
      setInternalExpandedIds(allIds);
    }
  }, [data, getAllNodeIds, onExpand]);

  // Collapse all
  const collapseAll = useCallback(() => {
    if (onExpand) {
      onExpand([]);
    } else {
      setInternalExpandedIds([]);
    }
  }, [onExpand]);

  const contextValue: TreeViewContextValue = {
    selectedIds,
    expandedIds,
    onSelect: handleSelect,
    onToggle: handleToggle,
    onNodeAction,
    showActions,
    showCheckboxes,
    editable,
  };

  if (data.length === 0) {
    return (
      <div className={cn('text-center py-8 text-gray-500 dark:text-gray-400', className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <TreeViewContext.Provider value={contextValue}>
      <div className={cn('select-none', className)}>
        <div className="space-y-1">
          {data.map((node) => (
            <TreeNodeComponent key={node.id} node={node} level={0} />
          ))}
        </div>
      </div>
    </TreeViewContext.Provider>
  );
}

// TreeNode Component
interface TreeNodeComponentProps {
  node: TreeNode;
  level: number;
}

function TreeNodeComponent({ node, level }: TreeNodeComponentProps) {
  const context = useContext(TreeViewContext);
  if (!context) return null;

  const {
    selectedIds,
    expandedIds,
    onSelect,
    onToggle,
    onNodeAction,
    showActions,
    showCheckboxes,
    editable,
  } = context;

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.label);

  const isSelected = selectedIds.includes(node.id);
  const isExpanded = expandedIds.includes(node.id);
  const hasChildren = node.children && node.children.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    if (node.disabled) return;
    onSelect(node.id, e.ctrlKey || e.metaKey);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(node.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (hasChildren) {
        onToggle(node.id);
      } else {
        onSelect(node.id);
      }
    }
  };

  const handleEditSubmit = () => {
    if (editValue.trim() && editValue !== node.label) {
      onNodeAction?.('rename', { ...node, label: editValue.trim() });
    }
    setIsEditing(false);
  };

  // Default icons
  const DefaultIcon = hasChildren
    ? isExpanded
      ? FolderOpen
      : Folder
    : File;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer transition-colors',
          isSelected
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700',
          node.disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
      >
        {/* Expand/Collapse button */}
        <button
          onClick={handleToggleClick}
          className={cn(
            'p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600',
            !hasChildren && 'invisible'
          )}
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {/* Checkbox */}
        {showCheckboxes && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => {}}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
        )}

        {/* Icon */}
        <span className="flex-shrink-0">
          {node.icon || <DefaultIcon className="w-4 h-4 text-gray-500" />}
        </span>

        {/* Label */}
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEditSubmit();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            className="flex-1 px-1 py-0.5 text-sm bg-white dark:bg-gray-800 border border-primary-500 rounded outline-none"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-sm truncate">{node.label}</span>
        )}

        {/* Actions */}
        {(showActions || editable) && (
          <div className="relative flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                  {editable && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Edit2 className="w-4 h-4" />
                        Renomear
                      </button>
                      {hasChildren && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNodeAction?.('addChild', node);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar filho
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNodeAction?.('delete', node);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="animate-[slideDown_0.2s_ease-out]">
          {node.children!.map((child) => (
            <TreeNodeComponent key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// Simple file tree variant
interface FileTreeProps {
  files: Array<{
    path: string;
    name: string;
    type: 'file' | 'folder';
    icon?: ReactNode;
  }>;
  onSelect?: (path: string) => void;
  selectedPath?: string;
  className?: string;
}

export function FileTree({ files, onSelect, selectedPath, className }: FileTreeProps) {
  // Convert flat file list to tree structure
  const treeData = useMemo(() => {
    const root: TreeNode[] = [];
    const pathMap = new Map<string, TreeNode>();

    // Sort files to ensure folders come first
    const sortedFiles = [...files].sort((a, b) => {
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });

    sortedFiles.forEach((file) => {
      const parts = file.path.split('/');
      let currentPath = '';
      let parentChildren = root;

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isLast = index === parts.length - 1;

        let node = pathMap.get(currentPath);
        if (!node) {
          node = {
            id: currentPath,
            label: part,
            icon: isLast ? file.icon : undefined,
            children: isLast && file.type === 'file' ? undefined : [],
          };
          pathMap.set(currentPath, node);
          parentChildren.push(node);
        }

        if (node.children) {
          parentChildren = node.children;
        }
      });
    });

    return root;
  }, [files]);

  return (
    <TreeView
      data={treeData}
      selectedIds={selectedPath ? [selectedPath] : []}
      onSelect={(ids) => onSelect?.(ids[0])}
      defaultExpandAll
      className={className}
    />
  );
}

// Category tree (for finance categories)
interface CategoryTreeProps {
  categories: Array<{
    id: string;
    name: string;
    parentId?: string | null;
    color?: string;
    icon?: string;
    count?: number;
  }>;
  onSelect?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  selectedId?: string;
  editable?: boolean;
  className?: string;
}

export function CategoryTree({
  categories,
  onSelect,
  onEdit,
  onDelete,
  selectedId,
  editable = false,
  className,
}: CategoryTreeProps) {
  // Convert flat categories to tree
  const treeData = useMemo(() => {
    const nodeMap = new Map<string, TreeNode>();
    const root: TreeNode[] = [];

    // Create all nodes
    categories.forEach((cat) => {
      nodeMap.set(cat.id, {
        id: cat.id,
        label: cat.count !== undefined ? `${cat.name} (${cat.count})` : cat.name,
        icon: cat.color ? (
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: cat.color }}
          />
        ) : undefined,
        children: [],
        data: cat,
      });
    });

    // Build tree structure
    categories.forEach((cat) => {
      const node = nodeMap.get(cat.id)!;
      if (cat.parentId && nodeMap.has(cat.parentId)) {
        nodeMap.get(cat.parentId)!.children!.push(node);
      } else {
        root.push(node);
      }
    });

    // Remove empty children arrays
    nodeMap.forEach((node) => {
      if (node.children?.length === 0) {
        node.children = undefined;
      }
    });

    return root;
  }, [categories]);

  const handleNodeAction = (action: string, node: TreeNode) => {
    switch (action) {
      case 'rename':
      case 'edit':
        onEdit?.(node.id);
        break;
      case 'delete':
        onDelete?.(node.id);
        break;
    }
  };

  return (
    <TreeView
      data={treeData}
      selectedIds={selectedId ? [selectedId] : []}
      onSelect={(ids) => onSelect?.(ids[0])}
      onNodeAction={handleNodeAction}
      editable={editable}
      defaultExpandAll
      className={className}
    />
  );
}

export type { TreeNode };
export default TreeView;
