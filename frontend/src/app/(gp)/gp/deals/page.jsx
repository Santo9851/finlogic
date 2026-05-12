'use client'

/**
 * (gp)/deals/page.jsx
 * Interactive Kanban board for PE deal flow management.
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  MouseSensor,
  TouchSensor,
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Clock, 
  BrainCircuit, 
  CheckSquare, 
  Loader2,
  Lock
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import Link from 'next/link';

// Column definitions based on backend model
const COLUMNS = [
  { id: 'PENDING_SUBMISSION', title: 'Pending', color: '#94a3b8' },
  { id: 'SUBMITTED', title: 'Submitted', color: '#6366f1' },
  { id: 'SCREENING', title: 'Screening', color: '#3b82f6' },
  { id: 'IC_REVIEW', title: 'IC Review', color: '#f59e0b' },
  { id: 'TERM_SHEET', title: 'Term Sheet', color: '#14b8a6' },
  { id: 'LOI_ISSUED', title: 'LOI Issued', color: '#8b5cf6' },
  { id: 'CONTRACT_SIGNED', title: 'Contract Signed', color: '#06b6d4' },
  { id: 'CAPITAL_CALLED', title: 'Capital Called', color: '#ec4899' },
  { id: 'CLOSED', title: 'Closed', color: '#22c55e' },
  { id: 'DECLINED', title: 'Declined', color: '#ef4444' },
];

export default function GPDealsKanbanPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState(null);
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter');

  // 1. Fetch data
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['deals', 'projects'],
    queryFn: async () => {
      const res = await api.get('/deals/projects/');
      return res.data?.results ?? res.data ?? [];
    }
  });

  // 2. Mutation for status update (optimistic)
  const mutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await api.patch(`/deals/projects/${id}/`, { status });
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ['deals', 'projects'] });
      const previous = queryClient.getQueryData(['deals', 'projects']);
      
      queryClient.setQueryData(['deals', 'projects'], (old) => {
        return old.map(p => p.id === id ? { ...p, status } : p);
      });
      
      return { previous };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['deals', 'projects'], context.previous);
      // Extract specific validation message from the backend response
      const errData = err?.response?.data;
      let message = 'Failed to update deal status.';
      if (errData) {
        if (errData.status) {
          // DRF ValidationError with field-level errors: { status: ["..."] } or { status: "..." }
          message = Array.isArray(errData.status) ? errData.status[0] : errData.status;
        } else if (errData.detail) {
          message = errData.detail;
        } else if (typeof errData === 'string') {
          message = errData;
        }
      }
      toast.error(message);
    },
    onSuccess: () => {
      toast.success('Deal moved');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['deals', 'projects'] });
    }
  });

  // 3. DND Sensors
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 4. Group projects by column
  const filteredProjects = useMemo(() => {
    let result = projects;
    
    if (filter === 'pending') {
      result = result.filter(p => p.status === 'PENDING_SUBMISSION');
    } else if (filter === 'submitted') {
      result = result.filter(p => p.status !== 'PENDING_SUBMISSION');
    } else if (filter === 'review') {
      result = result.filter(p => ['SCREENING', 'IC_REVIEW'].includes(p.status));
    }

    return result.filter(p => 
      p.legal_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.company_name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [projects, search, filter]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeDeal = projects.find(p => p.id === active.id);
    const overId = over.id;

    // Determine if we dropped on a column or an item
    const isColumn = COLUMNS.some(c => c.id === overId);
    let newStatus = isColumn ? overId : projects.find(p => p.id === overId)?.status;

    if (newStatus && activeDeal.status !== newStatus) {
      mutation.mutate({ id: active.id, status: newStatus });
    }
  };

  const activeDeal = useMemo(() => projects.find(p => p.id === activeId), [activeId, projects]);

  if (isLoading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#F59F01] animate-spin" />
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-6 theme-transition">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Deal Pipeline</h1>
          <p className="text-text-muted text-sm font-medium">Managing {projects.length} active opportunities</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/30" size={16} />
            <input 
              type="text" 
              placeholder="Search deals..."
              className="bg-foreground/5 border border-border-theme rounded-lg pl-9 pr-4 py-2 text-sm text-foreground outline-none focus:border-[#F59F01]/40 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link href="/gp/deals/new" className="bg-[#F59F01] text-ls-primary-fixed text-sm font-black px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#F59F01]/90 transition-colors shadow-lg shadow-[#F59F01]/10">
            <Plus size={18} /> New Deal
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent">
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={(e) => setActiveId(e.active.id)}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-w-max h-full">
            {COLUMNS.map(col => (
              <KanbanColumn 
                key={col.id} 
                column={col} 
                items={filteredProjects.filter(p => p.status === col.id)} 
              />
            ))}
          </div>

          <DragOverlay>
            {activeId ? (
              <div className="scale-105 rotate-2">
                <KanbanCard deal={activeDeal} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

function KanbanColumn({ column, items }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`w-72 flex flex-col bg-foreground/[0.02] border border-border-theme rounded-xl h-full transition-all duration-200 theme-transition ${
        isOver ? 'bg-foreground/5 border-foreground/20' : ''
      }`}
    >
      <div className="p-4 border-b border-border-theme flex items-center justify-between bg-foreground/[0.01]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">{column.title}</h3>
          <span className="text-[10px] bg-foreground/5 px-2 py-0.5 rounded-full text-text-muted font-bold border border-border-theme">
            {items.length}
          </span>
        </div>
      </div>
      
      <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[500px]">
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map(deal => (
            <KanbanCard key={deal.id} deal={deal} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

function KanbanCard({ deal, isOverlay = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: deal.id, disabled: !deal.can_access });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const daysInStage = deal.created_at ? Math.floor((new Date() - new Date(deal.created_at)) / (1000 * 60 * 60 * 24)) : 0;
  const isICReview = deal.status === 'IC_REVIEW';
  const router = useRouter();

  const handleCardClick = (e) => {
    // Prevent navigation if clicking the drag handle or specific actions
    if (e.target.closest('.drag-handle')) return;
    if (!deal.can_access) {
      toast.error('You do not have permission to view this deal.');
      return;
    }
    router.push(`/gp/deals/${deal.id}`);
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...(deal.can_access ? attributes : {})}
      {...(deal.can_access ? listeners : {})}
      onClick={handleCardClick}
      className={`group bg-card border rounded-xl p-4 shadow-xl hover:border-foreground/20 transition-all theme-transition ${deal.can_access ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed opacity-75'} ${
        isICReview ? 'border-[#f59e0b]/60 shadow-[0_0_20px_rgba(245,158,11,0.05)]' : 'border-border-theme'
      } ${isOverlay ? 'shadow-2xl z-50 scale-105 rotate-2' : ''} ${isDragging ? 'opacity-0' : ''}`}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <h4 className="text-sm font-semibold text-foreground group-hover:text-[#F59F01] transition-colors line-clamp-2 leading-relaxed">
            {!deal.can_access && <Lock size={14} className="inline-block mr-2 text-text-muted/40" />}
            {deal.legal_name}
          </h4>
          <div className="text-text-muted/10 group-hover:text-text-muted transition-colors">
            <MoreVertical size={16} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] bg-foreground/5 text-text-muted px-2 py-1 rounded-md border border-border-theme font-medium">
            {deal.sector}
          </span>
          <span className="text-[10px] bg-[#0B6EC3]/10 text-[#0B6EC3] px-2 py-1 rounded-md border border-[#0B6EC3]/20 font-bold">
            {deal.deal_type_display}
          </span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border-theme">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-text-muted/40">
              <Clock size={12} className={daysInStage > 7 ? 'text-red-400' : ''} />
              <span>{daysInStage}d</span>
            </div>
            {deal.ai_score && (
              <div className="flex items-center gap-1.5 text-[10px] text-[#F59F01] font-bold">
                <BrainCircuit size={12} />
                <span>{deal.ai_score}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted/50 font-bold bg-foreground/5 px-2 py-1 rounded-full border border-border-theme">
            <CheckSquare size={12} className="text-[#10b981]" />
            <span>{deal.compliance_stats?.cleared ?? 0}/{deal.compliance_stats?.total ?? 5}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
