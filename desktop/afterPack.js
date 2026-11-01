// Sets exe icon + version info without wine (pure JS resedit), since rcedit needs wine on Linux.
const fs = require('fs'), path = require('path');
exports.default = async (ctx) => {
  if (ctx.electronPlatformName !== 'win32') return;
  const ResEdit = require('resedit'), PE = require('pe-library');
  const name = ctx.packager.appInfo.productFilename;
  const exe = path.join(ctx.appOutDir, name + '.exe');
  const pe = PE.NtExecutable.from(fs.readFileSync(exe), { ignoreCert: true });
  const res = PE.NtExecutableResource.from(pe);
  const ico = ResEdit.Data.IconFile.from(fs.readFileSync(path.join(__dirname, 'build', 'icon.ico')));
  const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
  const gid = groups.length ? groups[0].id : 1, lang = groups.length ? groups[0].lang : 1033;
  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, gid, lang, ico.icons.map(i => i.data));
  const vi = ResEdit.Resource.VersionInfo.fromEntries(res.entries)[0];
  if (vi) {
    const v = ctx.packager.appInfo.version.split('.').map(Number);
    vi.setFileVersion(v[0], v[1], v[2], 0); vi.setProductVersion(v[0], v[1], v[2], 0);
    vi.setStringValues({ lang: 1033, codepage: 1200 }, { ProductName: 'CRM для клиник', FileDescription: 'CRM для клиник', CompanyName: 'CRM для клиник', OriginalFilename: name + '.exe' });
    vi.outputToResourceEntries(res.entries);
  }
  res.outputResource(pe);
  fs.writeFileSync(exe, Buffer.from(pe.generate()));
};
