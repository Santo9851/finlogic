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
  { id: 'PENDING_SUBMISSION', title: 'Pending', color: '#3A3153' }, // Supporting Brand Purple-Grey
  { id: 'SUBMITTED', title: 'Submitted', color: '#0B6EC3' }, // Brand Blue (ls-secondary)
  { id: 'SCREENING', title: 'Screening', color: '#4F46E5' }, // Indigo
  { id: 'IC_REVIEW', title: 'IC Review', color: '#F59F01' }, // Brand Gold (ls-compliment)
  { id: 'TERM_SHEET', title: 'Term Sheet', color: '#06B6D4' }, // Cyan
  { id: 'LOI_ISSUED', title: 'LOI Issued', color: '#8B5CF6' }, // Purple
  { id: 'CONTRACT_SIGNED', title: 'Contract', color: '#10B981' }, // Emerald
  { id: 'CAPITAL_CALLED', title: 'Called', color: '#D946EF' }, // Fuchsia
  { id: 'CLOSED', title: 'Closed', color: '#16c784' }, // Brand Green
  { id: 'DECLINED', title: 'Declined', color: '#ea3943' }, // Brand Red
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
      const data = res.data?.results ?? res.data;
      return Array.isArray(data) ? data : [];
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
      const errData = err?.response?.data;
      let message = 'Failed to update deal status.';
      if (errData) {
        if (errData.status) {
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
      toast.success('Deal status updated');
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
      if (newStatus === 'CAPITAL_CALLED') {
        toast.error("Institutional Authorization Required: Only Superadmins can initiate capital drawdowns.");
        return;
      }

      // Lock backward movement if SPA is uploaded
      if (activeDeal.documents?.some(d => d.category === 'SPA')) {
        const currentIndex = COLUMNS.findIndex(c => c.id === activeDeal.status);
        const newIndex = COLUMNS.findIndex(c => c.id === newStatus);
        if (newIndex < currentIndex) {
          toast.error("Document Locked: Cannot revert status once the signed SPA is uploaded. Contact Superadmin for revision.");
          return;
        }
      }
      
      mutation.mutate({ id: active.id, status: newStatus });
    }
  };

  const activeDeal = useMemo(() => projects.find(p => p.id === activeId), [activeId, projects]);

  if (isLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-2 border-ls-compliment border-t-transparent rounded-full animate-spin" />
      <p className="text-text-muted text-xs font-black uppercase tracking-widest animate-pulse">Synchronizing Pipeline...</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-8 pb-10 theme-transition">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-1">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight uppercase">Deal Pipeline</h1>
          <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2">
            Managing {projects.length} Active Private Market Opportunities
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/40" size={14} />
            <input 
              type="text" 
              placeholder="Search deals by name..."
              className="bg-card border border-border-theme rounded-xl pl-10 pr-4 py-3 text-xs font-bold text-foreground placeholder:text-text-muted/20 outline-none focus:border-ls-compliment transition-all w-64 shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Link 
            href="/gp/deals/invite" 
            className="bg-card border border-border-theme hover:border-ls-compliment hover:text-ls-compliment text-text-muted text-[10px] font-black uppercase tracking-[0.2em] px-5 py-3.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
          >
            Invite Counterparty
          </Link>

          <Link 
            href="/gp/deals/new" 
            className="bg-ls-compliment text-ls-primary-fixed text-[10px] font-black uppercase tracking-[0.2em] px-5 py-3.5 rounded-xl flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-ls-compliment/25"
          >
            <Plus size={14} /> New Deal
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
          <div className="flex gap-4 min-w-max h-full px-1">
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
      className={`w-72 flex flex-col bg-card/25 border border-border-theme rounded-3xl h-full transition-all duration-300 theme-transition ${
        isOver ? 'bg-foreground/[0.02] border-ls-compliment/30 shadow-[inset_0_0_20px_rgba(245,159,1,0.02)]' : ''
      }`}
    >
      <div className="p-5 border-b border-border-theme/60 flex items-center justify-between bg-foreground/[0.01]">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ backgroundColor: column.color }} />
          <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.15em]">{column.title}</h3>
          <span className="text-[9px] bg-foreground/[0.03] px-2 py-0.5 rounded-full text-text-muted font-black border border-border-theme/40 shadow-sm">
            {items.length}
          </span>
        </div>
      </div>
      
      <div className="flex-1 p-4 space-y-4 overflow-y-auto min-h-[500px]">
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
  } = useSortable({ 
    id: deal.id, 
    disabled: !deal.can_access || deal.status === 'CAPITAL_CALLED' 
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const daysInStage = deal.created_at ? Math.floor((new Date() - new Date(deal.created_at)) / (1000 * 60 * 60 * 24)) : 0;
  const isICReview = deal.status === 'IC_REVIEW';
  const router = useRouter();

  const handleCardClick = (e) => {
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
      className={`group bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-ls-compliment/30 transition-all theme-transition ${deal.can_access ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed opacity-70'} ${
        isICReview ? 'border-ls-compliment/60 shadow-[0_0_20px_rgba(245,158,11,0.03)]' : 'border-border-theme'
      } ${isOverlay ? 'shadow-2xl z-50 scale-105 rotate-2' : ''} ${isDragging ? 'opacity-0' : ''}`}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <h4 className="text-xs font-bold text-foreground group-hover:text-ls-compliment transition-colors line-clamp-2 leading-relaxed uppercase tracking-tight">
            {!deal.can_access && <Lock size={12} className="inline-block mr-2 text-text-muted/40" />}
            {deal.legal_name || deal.company_name}
          </h4>
          <div className="text-text-muted/10 group-hover:text-text-muted transition-colors drag-handle">
            <MoreVertical size={16} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-[9px] bg-foreground/5 text-text-muted px-2.5 py-1 rounded-lg border border-border-theme font-black uppercase tracking-wider">
            {deal.sector || 'Cross-Sector'}
          </span>
          <span className="text-[9px] bg-ls-secondary/10 text-ls-secondary px-2.5 py-1 rounded-lg border border-ls-secondary/20 font-black uppercase tracking-wider">
            {deal.deal_type_display}
          </span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border-theme">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[9px] font-black uppercase text-text-muted/40">
              <Clock size={12} className={daysInStage > 7 ? 'text-rose-500' : ''} />
              <span>{daysInStage}d</span>
            </div>
            {deal.ai_score && (
              <div className="flex items-center gap-1 bg-ls-compliment/10 px-2 py-0.5 rounded-full border border-ls-compliment/20 text-[9px] text-ls-compliment font-black uppercase tracking-widest">
                <BrainCircuit size={10} />
                <span>{deal.ai_score}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-[9px] text-text-muted/50 font-black uppercase bg-foreground/[0.02] px-2 py-0.5 rounded-full border border-border-theme">
            <CheckSquare size={12} className="text-emerald-500" />
            <span>{deal.compliance_stats?.cleared ?? 0}/{deal.compliance_stats?.total ?? 5}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
