import * as yup from 'yup'

export const reorderSchema = yup.object({
    parentKey: yup.string().required('parentKey is required'),
    sourceKey: yup.string().required('sourceKey is required'),
    targetKey: yup.string().optional(),
    targetIndex: yup.number().integer().min(0).optional(),
}).test('target-provided', 'Either targetKey or targetIndex is required', (value) => {
    return !!(value?.targetKey || typeof value?.targetIndex === 'number')
})

