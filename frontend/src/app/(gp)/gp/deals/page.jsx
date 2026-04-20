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
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { useRouter } from 'next/navigation';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Clock, 
  BrainCircuit, 
  CheckSquare, 
  Loader2
} from 'lucide-react';
import api from '@/services/api';
import { toast } from 'sonner';
import Link from 'next/link';

// Column definitions based on backend model
const COLUMNS = [
  { id: 'SUBMITTED', title: 'Submitted', color: '#6366f1' },
  { id: 'SCREENING', title: 'Screening', color: '#3b82f6' },
  { id: 'AI_REVIEW_NEEDED', title: 'AI Review', color: '#f59e0b' },
  { id: 'GP_APPROVED', title: 'GP Approved', color: '#10b981' },
  { id: 'SHORTLISTED', title: 'Shortlisted', color: '#8b5cf6' },
  { id: 'VIDEO_PITCH', title: 'Video Pitch', color: '#ec4899' },
  { id: 'DUE_DILIGENCE', title: 'Due Diligence', color: '#06b6d4' },
  { id: 'TERM_SHEET', title: 'Term Sheet', color: '#14b8a6' },
  { id: 'CLOSED', title: 'Closed', color: '#22c55e' },
  { id: 'DECLINED', title: 'Declined', color: '#ef4444' },
];

export default function GPDealsKanbanPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState(null);

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
      toast.error('Failed to update deal status.');
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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 4. Group projects by column
  const filteredProjects = useMemo(() => {
    return projects.filter(p => 
      p.legal_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [projects, search]);

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
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Deal Pipeline</h1>
          <p className="text-white/40 text-sm">Managing {projects.length} active opportunities</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input 
              type="text" 
              placeholder="Search deals..."
              className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white outline-none focus:border-[#F59F01]/40 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link href="/gp/deals/new" className="bg-[#F59F01] text-black text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#F59F01]/90 transition-colors shadow-lg shadow-[#F59F01]/10">
            <Plus size={18} /> New Deal
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
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
      className={`w-72 flex flex-col bg-white/[0.02] border border-white/5 rounded-xl h-full transition-all duration-200 ${
        isOver ? 'bg-white/5 border-white/20' : ''
      }`}
    >
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest">{column.title}</h3>
          <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-white/40 font-bold border border-white/5">
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
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const daysInStage = deal.created_at ? Math.floor((new Date() - new Date(deal.created_at)) / (1000 * 60 * 60 * 24)) : 0;
  const isAIRework = deal.status === 'AI_REVIEW_NEEDED';
  const router = useRouter();

  const handleCardClick = (e) => {
    // Prevent navigation if clicking the drag handle or specific actions
    if (e.target.closest('.drag-handle')) return;
    router.push(`/gp/deals/${deal.id}`);
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      onClick={handleCardClick}
      className={`group bg-[#0A0014] border rounded-xl p-4 shadow-xl hover:border-white/20 transition-all cursor-pointer active:scale-[0.98] ${
        isAIRework ? 'border-[#f59e0b]/60 shadow-[0_0_20px_rgba(245,158,11,0.05)] animate-pulse-orange' : 'border-white/10'
      } ${isOverlay ? 'shadow-2xl z-50' : ''}`}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <h4 className="text-sm font-semibold text-white group-hover:text-[#F59F01] transition-colors line-clamp-2 leading-relaxed">
            {deal.legal_name}
          </h4>
          <div 
            {...attributes}
            {...listeners}
            className="drag-handle text-white/10 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-grab active:cursor-grabbing"
          >
            <MoreVertical size={16} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] bg-white/5 text-white/60 px-2 py-1 rounded-md border border-white/5 font-medium">
            {deal.sector}
          </span>
          <span className="text-[10px] bg-[#0B6EC3]/10 text-[#0B6EC3] px-2 py-1 rounded-md border border-[#0B6EC3]/20 font-bold">
            {deal.deal_type_display}
          </span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-white/40">
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
          
          <div className="flex items-center gap-1.5 text-[10px] text-white/50 font-bold bg-white/5 px-2 py-1 rounded-full border border-white/5">
            <CheckSquare size={12} className="text-[#10b981]" />
            <span>{deal.compliance_gates || "3/5"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
