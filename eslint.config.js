import coreWebVitals from 'eslint-config-next/core-web-vitals'

export default [
    {
        ignores: ['tailwind.config.js', 'postcss.config.js', 'eslint.config.js']
    },
    ...coreWebVitals,
    {
        rules: {
            'react-hooks/set-state-in-effect': 'off'
        }
    }
]
