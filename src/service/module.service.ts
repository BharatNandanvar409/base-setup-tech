export interface Submodule {
    key: string;
    name: string;
}

export interface Module {
    key: string;
    name: string;
    children: Submodule[];
}

export class ModuleService {
    private modules: Module[] = [
        {
            key: 'A',
            name: 'Module A',
            children: [
                { key: 'A1', name: 'sub module A1' },
                { key: 'A2', name: 'sub module A2' },
                { key: 'A3', name: 'sub module A3' },
                { key: 'A4', name: 'sub module A4' },
            ],
        },
        {
            key: 'B',
            name: 'Module B',
            children: [
                { key: 'B1', name: 'sub module B1' },
                { key: 'B2', name: 'sub module B2' },
            ],
        },
    ];

    getModules(): Module[] {
        return this.modules;
    }

    reorder(payload: { parentKey: string; sourceKey: string; targetKey?: string; targetIndex?: number }): Module {
        const { parentKey, sourceKey, targetKey, targetIndex } = payload;
        const parent = this.modules.find(m => m.key === parentKey);
        if (!parent) {
            throw new Error('Parent module not found');
        }

        const sourceIdx = parent.children.findIndex(c => c.key === sourceKey);
        if (sourceIdx < 0) {
            throw new Error('Source sub module not found');
        }

        let destIdx: number | undefined = undefined;
        if (typeof targetIndex === 'number') {
            destIdx = Math.max(0, Math.min(targetIndex, parent.children.length - 1));
        } else if (targetKey) {
            destIdx = parent.children.findIndex(c => c.key === targetKey);
            if (destIdx < 0) {
                throw new Error('Target sub module not found');
            }
        }

        if (typeof destIdx !== 'number') {
            throw new Error('Target position is required');
        }

        if (destIdx === sourceIdx) {
            this.renumberChildren(parent);
            return parent;
        }

        if (targetKey) {
            const tmp = parent.children[sourceIdx]!;
            const destItem = parent.children[destIdx]!;
            parent.children[sourceIdx] = destItem;
            parent.children[destIdx] = tmp;
        } else {
            const moved = parent.children.splice(sourceIdx, 1)[0]!;
            parent.children.splice(destIdx, 0, moved);
        }

        this.renumberChildren(parent);
        return parent;
    }

    private renumberChildren(parent: Module): void {
        parent.children = parent.children.map((c, i) => {
            const newKey = `${parent.key}${i + 1}`;
            return { key: newKey, name: `sub module ${newKey}` };
        });
    }
}

