# Mind Map

> Transforme documentos em Mind Maps interativos

Uma aplicação web white-label para criar mapas mentais a partir de documentos PDF, PowerPoint, TXT e Markdown.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)
![Markmap](https://img.shields.io/badge/Markmap-0.17-orange)

## Features

- **Múltiplos Formatos**: PDF, PPTX, TXT, MD, DOCX
- **OCR Automático**: Reconhece texto em PDFs escaneados (Tesseract.js)
- **Editor Dual**: Markdown + Drag & Drop visual
- **Preview em Tempo Real**: Veja as mudanças instantaneamente
- **Modo Apresentação**: Tela cheia com navegação por nós
- **Exportação Flexível**: SVG, PNG, PDF paginado
- **100% Client-Side**: Sem servidor, seus dados ficam no browser

## 🚀 Quick Start

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Layout principal
│   ├── page.tsx            # Página inicial
│   └── globals.css         # Estilos globais
├── components/             # Componentes React
│   ├── ui/                 # Componentes de UI reutilizáveis
│   ├── FileUpload.tsx      # Upload de arquivos
│   ├── MarkdownEditor.tsx  # Editor de texto
│   ├── DragDropEditor.tsx  # Editor visual
│   ├── MindmapPreview.tsx  # Preview do mind map
│   ├── PresentationMode.tsx# Modo apresentação
│   └── ...
├── hooks/                  # Custom hooks
│   ├── useFileProcessor.ts # Processamento de arquivos
│   ├── useMarkmap.ts       # Integração Markmap
│   └── useFullscreen.ts    # Controle fullscreen
├── lib/                    # Utilitários e lógica
│   ├── extractors/         # Extratores por tipo
│   │   ├── pdf.ts
│   │   ├── pptx.ts
│   │   ├── txt.ts
│   │   ├── docx.ts
│   │   └── ocr.ts
│   ├── markdown/           # Parser Markdown
│   ├── export/             # Exportadores
│   └── utils.ts
├── store/                  # Estado global (Zustand)
│   └── mindmapStore.ts
└── types/                  # TypeScript types
    └── index.ts
```

## 🛠️ Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript 5.5 |
| Styling | Tailwind CSS 3.4 |
| Mind Map Engine | markmap-lib + markmap-view |
| Drag & Drop | @dnd-kit |
| PDF Extração | pdf.js |
| OCR | Tesseract.js |
| PPTX Parser | JSZip + XML parsing |
| DOCX Parser | Mammoth |
| Estado | Zustand |
| Animações | Framer Motion |
| Export PDF | jsPDF + html2canvas |
| Toasts | react-hot-toast |

## 🎮 Atalhos de Teclado

### Preview
- `+` / `-`: Zoom in/out
- `0`: Ajustar à tela
- `F11`: Tela cheia

### Modo Apresentação
- `←` `→`: Navegar nós
- `Home`: Voltar ao início
- `+` `-`: Zoom
- `F`: Fullscreen
- `Esc`: Sair

### Editor
- `Tab`: Indentar
- `Shift+Tab`: Remover indentação

## 📤 Deploy na Vercel

```bash
# Via CLI
npm i -g vercel
vercel

# Ou conecte o repositório no dashboard da Vercel
```

## Customização

### Cores da Marca

Edite `tailwind.config.ts`:

```ts
colors: {
  brand: {
    500: '#sua-cor',
    600: '#sua-cor-escura',
    // ...
  }
}
```

### Logo

Substitua o SVG em `Header.tsx`

### Cores do Mind Map

Edite em `useMarkmap.ts`:

```ts
color: (node) => {
  const colors = ['#2563eb', '#059669', ...];
  return colors[node.state?.depth % colors.length];
}
```

## Licença

MIT © Mind Map App

---

Feito com  usando [Markmap](https://github.com/markmap/markmap)
