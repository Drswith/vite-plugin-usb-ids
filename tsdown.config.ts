import { defineConfig } from 'tsdown'

export default defineConfig((_) => {
  const share = {
    clean: true,
    tsconfig: 'tsconfig.node.json',
    target: 'node16',
    noExternal: [
      'dayjs',
    ],
  }

  return [
    {
      ...share,
      entry: [
        'src/index.ts',
      ],
      format: 'esm',
    },
    {
      ...share,
      entry: [
        'src/index.ts',
      ],
      dts: false,
      format: 'cjs',
    },
    {
      ...share,
      entry: [
        'src/types.ts',
      ],
      format: 'esm',
    },
  ]
})
