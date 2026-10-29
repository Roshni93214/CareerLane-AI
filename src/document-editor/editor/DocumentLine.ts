
import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    documentLine: {
      insertDocumentLine: () => ReturnType;
    };
  }
}

const DEFAULT_COLOR = '#0b4745';

export const DocumentLine = Node.create({
  name: 'documentLine',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      lineColor: {
        default: DEFAULT_COLOR,
        parseHTML: (el) =>
          el.getAttribute('data-line-color') || DEFAULT_COLOR,
        renderHTML: (attrs) => ({
          'data-line-color': attrs.lineColor,
        }),
      },
      lineThickness: {
        default: 2,
        parseHTML: (el) =>
          Number(el.getAttribute('data-line-thickness')) || 2,
        renderHTML: (attrs) => ({
          'data-line-thickness': String(attrs.lineThickness),
        }),
      },
      lineStyle: {
        default: 'solid',
        parseHTML: (el) =>
          el.getAttribute('data-line-style') || 'solid',
        renderHTML: (attrs) => ({
          'data-line-style': attrs.lineStyle,
        }),
      },
      lineWidth: {
        default: '100%',
        parseHTML: (el) =>
          el.getAttribute('data-line-width') || '100%',
        renderHTML: (attrs) => ({
          'data-line-width': attrs.lineWidth,
        }),
      },
      lineX: {
        default: null,
        parseHTML: (el) => {
          const value = el.getAttribute('data-line-x');
          return value === null ? null : Number(value);
        },
        renderHTML: (attrs) =>
          attrs.lineX == null
            ? {}
            : { 'data-line-x': String(attrs.lineX) },
      },
      lineY: {
        default: null,
        parseHTML: (el) => {
          const value = el.getAttribute('data-line-y');
          return value === null ? null : Number(value);
        },
        renderHTML: (attrs) =>
          attrs.lineY == null
            ? {}
            : { 'data-line-y': String(attrs.lineY) },
      },
      lineSpacingBefore: {
        default: '8px',
        parseHTML: (el) =>
          el.getAttribute('data-line-before') || '8px',
        renderHTML: (attrs) => ({
          'data-line-before': attrs.lineSpacingBefore,
        }),
      },
      lineSpacingAfter: {
        default: '8px',
        parseHTML: (el) =>
          el.getAttribute('data-line-after') || '8px',
        renderHTML: (attrs) => ({
          'data-line-after': attrs.lineSpacingAfter,
        }),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'hr' },
      { tag: 'div[data-document-line="true"]' },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const a = node.attrs;
    const floating = a.lineX != null && a.lineY != null;

    const style = [
      'display:block',
      `width:${a.lineWidth}`,
      'height:12px',
      'padding:0',
      'box-sizing:border-box',
      'border:0',
      `border-top:${a.lineThickness}px ${a.lineStyle} ${a.lineColor}`,
      `position:${floating ? 'absolute' : 'static'}`,
      ...(floating
        ? [`left:${a.lineX}px`, `top:${a.lineY}px`, 'margin:0', 'z-index:5']
        : [
            `margin-top:${a.lineSpacingBefore}`,
            `margin-bottom:${a.lineSpacingAfter}`,
          ]),
    ].join(';');

    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: 'document-line',
        'data-document-line': 'true',
        contenteditable: 'false',
        style,
      }),
    ];
  },

  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('div');
      let currentNode = node;
      let dragging = false;
      let startX = 0;
      let startY = 0;
      let startMouseX = 0;
      let startMouseY = 0;
      let nextX = 0;
      let nextY = 0;

      const render = (updatedNode: typeof node) => {
        currentNode = updatedNode;
        const a = updatedNode.attrs;
        const floating = a.lineX != null && a.lineY != null;

        dom.className = 'document-line';
        dom.dataset.documentLine = 'true';
        dom.setAttribute('contenteditable', 'false');
        dom.title = 'Click to select; drag to move';
        dom.style.display = 'block';
        dom.style.width = a.lineWidth;
        dom.style.height = '12px';
        dom.style.padding = '0';
        dom.style.border = '0';
        dom.style.borderTop =
          `${a.lineThickness}px ${a.lineStyle} ${a.lineColor}`;
        dom.style.boxSizing = 'border-box';
        dom.style.cursor = 'move';
        dom.style.touchAction = 'none';
        dom.style.userSelect = 'none';
        dom.style.position = floating ? 'absolute' : 'static';
        dom.style.marginTop = floating ? '0' : a.lineSpacingBefore;
        dom.style.marginBottom = floating ? '0' : a.lineSpacingAfter;
        dom.style.left = floating ? `${a.lineX}px` : '';
        dom.style.top = floating ? `${a.lineY}px` : '';
        dom.style.zIndex = floating ? '5' : '';
      };

      const onDown = (event: PointerEvent) => {
        if (event.button !== 0) return;

        const pos = getPos();
        if (typeof pos !== 'number') return;

        const root = editor.view.dom;
        const rootRect = root.getBoundingClientRect();
        const lineRect = dom.getBoundingClientRect();
        const scaleX = root.offsetWidth
          ? rootRect.width / root.offsetWidth
          : 1;
        const scaleY = root.offsetHeight
          ? rootRect.height / root.offsetHeight
          : 1;

        editor.commands.setNodeSelection(pos);

        startX = currentNode.attrs.lineX ??
          (lineRect.left - rootRect.left) / scaleX;
        startY = currentNode.attrs.lineY ??
          (lineRect.top - rootRect.top) / scaleY;

        startMouseX = event.clientX;
        startMouseY = event.clientY;
        nextX = startX;
        nextY = startY;
        dragging = true;

        dom.style.position = 'absolute';
        dom.style.margin = '0';
        dom.style.left = `${startX}px`;
        dom.style.top = `${startY}px`;

        dom.setPointerCapture(event.pointerId);
        event.preventDefault();
      };

      const onMove = (event: PointerEvent) => {
        if (!dragging) return;

        const root = editor.view.dom;
        const rootRect = root.getBoundingClientRect();
        const scaleX = root.offsetWidth
          ? rootRect.width / root.offsetWidth
          : 1;
        const scaleY = root.offsetHeight
          ? rootRect.height / root.offsetHeight
          : 1;

        nextX = Math.max(
          0,
          Math.min(
            root.offsetWidth - dom.offsetWidth,
            startX + (event.clientX - startMouseX) / scaleX,
          ),
        );
        nextY = Math.max(
          0,
          startY + (event.clientY - startMouseY) / scaleY,
        );

        dom.style.left = `${nextX}px`;
        dom.style.top = `${nextY}px`;
      };

      const onUp = (event: PointerEvent) => {
        if (!dragging) return;
        dragging = false;

        if (dom.hasPointerCapture(event.pointerId)) {
          dom.releasePointerCapture(event.pointerId);
        }

        const pos = getPos();
        if (typeof pos !== 'number') return;

        editor.view.dispatch(
          editor.state.tr.setNodeMarkup(pos, undefined, {
            ...currentNode.attrs,
            lineX: Math.round(nextX),
            lineY: Math.round(nextY),
          }),
        );
      };

      render(node);
      dom.addEventListener('pointerdown', onDown);
      dom.addEventListener('pointermove', onMove);
      dom.addEventListener('pointerup', onUp);
      dom.addEventListener('pointercancel', onUp);

      return {
        dom,
        update(updatedNode) {
          if (updatedNode.type !== currentNode.type) return false;
          render(updatedNode);
          return true;
        },
        destroy() {
          dom.removeEventListener('pointerdown', onDown);
          dom.removeEventListener('pointermove', onMove);
          dom.removeEventListener('pointerup', onUp);
          dom.removeEventListener('pointercancel', onUp);
        },
      };
    };
  },

  addCommands() {
    return {
      insertDocumentLine:
        () =>
        ({ state, editor, commands }) => {
          const { $from } = state.selection;
          let insertAt = state.selection.to;

          for (let depth = $from.depth; depth > 0; depth--) {
            const type = $from.node(depth).type.name;
            if (type === 'paragraph' || type === 'heading') {
              insertAt = $from.after(depth);
              break;
            }
          }

          const root = editor.view.dom;
          const bounds = root.getBoundingClientRect();
          const caret = editor.view.coordsAtPos(state.selection.from);
          const scaleY = root.offsetHeight
            ? bounds.height / root.offsetHeight
            : 1;
          const y = Math.max(
            0,
            Math.round((caret.top - bounds.top) / scaleY + 12),
          );

          const inserted = commands.insertContentAt(insertAt, {
            type: this.name,
            attrs: { lineX: 12, lineY: y },
          });

          if (!inserted) return false;
          return commands.setNodeSelection(insertAt);
        },
    };
  },
});
