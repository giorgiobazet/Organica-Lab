/**
 * Scripts que rodam no <head> antes da primeira pintura (sem "piscar"): aplicam o tema salvo e o
 * Modo Leve. Ficam num módulo comum (sem "use client") porque o layout, que roda no servidor,
 * precisa ler o texto deles.
 */
export const CHAVE_TEMA = "chempharm:theme";
export const CHAVE_MODO_LEVE = "organicalab:modo-leve";

export const themeInitScript = `(function(){try{var t=localStorage.getItem('${CHAVE_TEMA}');if(t!=='light'){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){document.documentElement.classList.add('dark')}})();`;

/** Modo Leve automático: até 2 GB de memória, até 4 núcleos, economia de dados ou "reduzir movimento". */
export const leveInitScript = `(function(){var l=false;try{var s=localStorage.getItem('${CHAVE_MODO_LEVE}');if(s==='1'){l=true}else if(s!=='0'){var n=navigator,c=n.connection;l=(n.deviceMemory!==undefined&&n.deviceMemory<=2)||(n.hardwareConcurrency!==undefined&&n.hardwareConcurrency<=4)||!!(c&&c.saveData)||matchMedia('(prefers-reduced-motion: reduce)').matches}}catch(e){}if(l)document.documentElement.classList.add('leve')})();`;
