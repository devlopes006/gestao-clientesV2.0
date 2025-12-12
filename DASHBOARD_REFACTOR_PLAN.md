# Plano de Refatoração do Dashboard

## Objetivo

Criar um dashboard ultra-compacto que caiba em 100vh (sem scroll vertical ou horizontal)

## Layout Proposto

```
┌────────────────────────────────────────────────────────────────┐
│ Header (h: 60px) - Logo + Busca + Filtros                      │
├────────────────────────────────────────────────────────────────┤
│ Main Content (flex-1, overflow-hidden)                          │
│ ┌────────────┬──────────────────────────┬────────────────────┐│
│ │ Col 1      │ Col 2 (Centro)            │ Col 3              ││
│ │ (3cols)    │ (6cols)                   │ (3cols)            ││
│ │            │                            │                    ││
│ │ KPIs       │ Calendário Compacto       │ Tarefas Pendentes  ││
│ │ (2x2 grid) │                            │ (lista scroll)     ││
│ │            │                            │                    ││
│ │ Notas      │ Gráficos (3 mini)         │ Tarefas Urgentes   ││
│ │ (scroll)   │ - Receitas                 │ (lista scroll)     ││
│ │            │ - Prioridades              │                    ││
│ │            │ - Por Cliente              │                    ││
│ └────────────┴──────────────────────────┴────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

##Dimensões

- Header: 60px
- Main: calc(100vh - 60px - 16px) // 16px = padding
- Grid: 12 colunas
- Gap: 12px (gap-3)

## Mudanças Chave

1. `h-screen overflow-hidden` no container principal
2. Header fixo compacto (60px)
3. Main com `flex-1` e `overflow-hidden`
4. Grid 12 colunas: 3 + 6 + 3
5. Todas as seções com altura fixa ou flex-1
6. Overflow apenas nas listas internas (tasks, notes)
7. Calendário compacto (max-h-64)
8. Gráficos mini (h-32)
