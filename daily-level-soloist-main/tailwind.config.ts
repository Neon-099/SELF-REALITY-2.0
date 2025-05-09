import type { Config } from "tailwindcss";
// @ts-ignore
import tailwindAnimate from "tailwindcss-animate";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			backdropBlur: {
				'xl': '16px',
				'2xl': '24px',
			},
			backgroundOpacity: {
				'40': '0.4',
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Solo leveling specific colors
				solo: {
					bg: '#121212',
					primary: '#3B82F6',
					secondary: '#8B5CF6',
					accent: '#10B981',
					text: '#F3F4F6',
					dark: '#1F2937',
					highlight: '#60A5FA',
					success: '#34D399',
					warning: '#FBBF24',
					danger: '#EF4444'
				}
			},
			dropShadow: {
				'glow': '0 0 4px rgba(255, 255, 255, 0.35)',
				'glow-lg': '0 0 7px rgba(255, 255, 255, 0.45)',
				'glow-primary': '0 0 5px rgba(59, 130, 246, 0.5)',
				'glow-secondary': '0 0 5px rgba(139, 92, 246, 0.5)',
				'glow-accent': '0 0 5px rgba(16, 185, 129, 0.5)',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'pulse-glow': {
					'0%, 100%': { 
						boxShadow: '0 0 5px rgba(59, 130, 246, 0.5)',
						opacity: '0.8'
					},
					'50%': { 
						boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)',
						opacity: '1'
					}
				},
				'pulse-slow': {
					'0%, 100%': { 
						opacity: '1',
						transform: 'scale(1)'
					},
					'50%': { 
						opacity: '0.7',
						transform: 'scale(1.05)'
					}
				},
				'level-up': {
					'0%': { 
						transform: 'scale(0.9)',
						opacity: '0'
					},
					'50%': {
						transform: 'scale(1.1)',
						opacity: '1'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				},
				'pulse-subtle': {
					'0%, 100%': { 
						opacity: '1',
						boxShadow: '0 0 0 rgba(255, 255, 255, 0)'
					},
					'50%': { 
						opacity: '0.9',
						boxShadow: '0 0 10px rgba(255, 255, 255, 0.2)'
					}
				},
				'text-glow': {
					'0%, 100%': {
						textShadow: '0 0 2px rgba(255, 255, 255, 0.1)'
					},
					'50%': {
						textShadow: '0 0 5px rgba(255, 255, 255, 0.3)'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-glow': 'pulse-glow 2s infinite',
				'pulse-slow': 'pulse-slow 3s infinite ease-in-out',
				'level-up': 'level-up 0.5s ease-out',
				'pulse-subtle': 'pulse-subtle 2s infinite ease-in-out',
				'text-glow': 'text-glow 2s infinite ease-in-out'
			}
		}
	},
	plugins: [tailwindAnimate],
} satisfies Config;
