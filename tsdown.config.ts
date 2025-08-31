import { defineConfig } from 'tsdown'

export default defineConfig((_) => {
  const share = {
    clean: true,
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
  ]
})
