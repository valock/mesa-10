const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');let html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
html=html.replace(/  <link rel="stylesheet" href="([^"]+)">/g,(_,name)=>'<style>'+fs.readFileSync(path.join(root,'dist',name),'utf8')+'</style>');
const scripts=[];html=html.replace(/  <script src="([^"]+)" defer><\/script>/g,(_,name)=>{scripts.push(fs.readFileSync(path.join(root,'dist',name),'utf8'));return '';});
html=html.replace('</body>',()=>'<script>'+scripts.join('\n')+'</script></body>');fs.writeFileSync(path.join(root,'mesa-10.html'),html);fs.writeFileSync(path.join(root,'dist/mesa-10.html'),html);console.log('HTML autônomo atualizado.');
