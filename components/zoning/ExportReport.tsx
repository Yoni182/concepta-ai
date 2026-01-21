import React, { useState } from 'react';
import { PlanningRightsObject, TamhilOutput, MassingAlternative, StyledMassing } from '../../types';

interface ExportReportProps {
  rights: PlanningRightsObject;
  tamhil: TamhilOutput;
  massing: MassingAlternative;
  styledMassing: StyledMassing;
  onBack: () => void;
}

const ExportReport: React.FC<ExportReportProps> = ({
  rights,
  tamhil,
  massing,
  styledMassing,
  onBack,
}) => {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'html' | 'json'>('pdf');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Prepare comprehensive report data
      const reportData = {
        project_info: {
          gush: rights.parcel.gush,
          helka: rights.parcel.helka,
          address: rights.parcel.address,
          area_sqm: rights.parcel.area_net_sqm,
        },
        planning_rights: {
          primary_use: rights.zoning.primary_use,
          allowed_uses: rights.zoning.allowed_secondary_uses,
          max_units: rights.rights.max_units,
          max_height_m: rights.rights.height_max_m,
          max_floors: rights.rights.floors_max,
          main_area_sqm: rights.rights.main_area_sqm,
          service_area_sqm: rights.rights.service_area_sqm,
          coverage_percent: rights.rights.coverage_percent,
        },
        constraints: rights.constraints,
        tamhil_summary: {
          total_units: tamhil.building_summary.total_units,
          total_floors: tamhil.building_summary.total_floors,
          total_main_area: tamhil.building_summary.total_main_area_sqm,
          unit_mix: tamhil.unit_mix_summary,
          floor_plans_count: tamhil.floor_plans.length,
        },
        massing_design: {
          height_m: massing.height_m,
          coverage_percent: massing.coverage_percent,
          towers: massing.towers.length,
          total_floors: massing.key_metrics.total_floors,
          fsi: massing.key_metrics.fsi,
          design_rationale: massing.design_rationale,
        },
        visualization: {
          architectural_style: styledMassing.design_dna.architectural_style,
          facade_language: styledMassing.design_dna.facade_language,
          primary_material: styledMassing.styled_materials.primary_material.name,
          design_description: styledMassing.design_description,
        },
        generated_at: new Date().toISOString(),
      };

      if (exportFormat === 'json') {
        // Download as JSON
        const dataStr = JSON.stringify(reportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `concepta-project-${rights.parcel.gush}-${rights.parcel.helka}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'html') {
        // Generate HTML report
        const htmlContent = generateHTMLReport(reportData);
        const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(htmlBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `concepta-project-${rights.parcel.gush}-${rights.parcel.helka}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'pdf') {
        // For PDF, we would typically use a library like jsPDF
        // For now, we'll provide a message to the user
        alert('PDF export coming soon. Try HTML export for a downloadable report.');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 md:px-0 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-3xl font-light uppercase tracking-tighter">Stage 5: Export & Report</h1>
        <p className="text-white/40 text-xs md:text-sm mt-1">
          Download your complete design package
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Section - Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Summary */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-8 space-y-6">
            <div>
              <h2 className="text-xl font-light uppercase tracking-tighter mb-4">Project Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-lg p-4 space-y-1">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Gush</p>
                  <p className="text-lg font-bold text-amber-400">{rights.parcel.gush}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 space-y-1">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Helka</p>
                  <p className="text-lg font-bold text-amber-400">{rights.parcel.helka}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 space-y-1">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Plot Area</p>
                  <p className="text-lg font-bold text-amber-400">{rights.parcel.area_net_sqm.toLocaleString()} m²</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 space-y-1">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Max Height</p>
                  <p className="text-lg font-bold text-amber-400">{rights.rights.height_max_m}m</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 space-y-1">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Max Units</p>
                  <p className="text-lg font-bold text-amber-400">{rights.rights.max_units}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 space-y-1">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Designed Units</p>
                  <p className="text-lg font-bold text-amber-400">{tamhil.building_summary.total_units}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Design Summary */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-8 space-y-4">
            <h2 className="text-xl font-light uppercase tracking-tighter">Design Specification</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-start py-3 border-b border-white/10">
                <span className="text-white/60">Architectural Style</span>
                <span className="text-amber-400 font-medium text-right">{styledMassing.design_dna.architectural_style}</span>
              </div>
              <div className="flex justify-between items-start py-3 border-b border-white/10">
                <span className="text-white/60">Facade Language</span>
                <span className="text-amber-400 font-medium text-right">{styledMassing.design_dna.facade_language}</span>
              </div>
              <div className="flex justify-between items-start py-3 border-b border-white/10">
                <span className="text-white/60">Primary Material</span>
                <span className="text-amber-400 font-medium text-right">{styledMassing.styled_materials.primary_material.name}</span>
              </div>
              <div className="flex justify-between items-start py-3">
                <span className="text-white/60">FSI (Floor Space Index)</span>
                <span className="text-amber-400 font-medium">{massing.key_metrics.fsi.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Export Options - Right */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/30 rounded-2xl p-8 space-y-6">
            <h2 className="text-xl font-light uppercase tracking-tighter text-amber-400">Download Package</h2>

            {/* Format Selection */}
            <div className="space-y-3">
              <p className="text-white/60 text-sm">Select export format:</p>
              <div className="space-y-2">
                {[
                  { id: 'pdf', label: 'PDF Report', desc: 'Professional layout' },
                  { id: 'html', label: 'HTML Report', desc: 'Interactive document' },
                  { id: 'json', label: 'JSON Data', desc: 'Raw data export' },
                ].map((format) => (
                  <button
                    key={format.id}
                    onClick={() => setExportFormat(format.id as 'pdf' | 'html' | 'json')}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      exportFormat === format.id
                        ? 'bg-amber-500/20 border-amber-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <p className="text-sm font-medium text-white">{format.label}</p>
                    <p className="text-xs text-white/40">{format.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:from-amber-400 hover:to-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19v-7m0 0V5m0 7l-4-4m4 4l4-4" />
                  </svg>
                  Download Report
                </>
              )}
            </button>

            {/* Info Box */}
            <div className="bg-white/5 rounded-lg p-4 space-y-2">
              <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Included in Export:</p>
              <ul className="space-y-1 text-xs text-white/60">
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Planning rights analysis</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Unit mix (Tamhil) specification</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Massing design details</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>3D visualization data</span>
                </li>
                <li className="flex gap-2">
                  <span>✓</span>
                  <span>Design DNA & materials</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Design Materials Preview */}
          <div className="space-y-3">
            <p className="text-white/60 text-sm font-medium">Material Colors</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg border-2 border-white/20 shadow-lg"
                  style={{ backgroundColor: styledMassing.styled_materials.primary_material.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{styledMassing.styled_materials.primary_material.name}</p>
                  <p className="text-[10px] text-white/40">{styledMassing.styled_materials.primary_material.color}</p>
                </div>
              </div>
              {styledMassing.styled_materials.secondary_materials.slice(0, 1).map((mat, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg border border-white/20"
                    style={{ backgroundColor: mat.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white/70 truncate">{mat.name}</p>
                    <p className="text-[10px] text-white/40">{mat.area_percent}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Back Button */}
      <div className="flex gap-4 justify-end">
        <button
          onClick={onBack}
          className="px-6 py-4 rounded-full border border-white/20 text-white/60 hover:bg-white/5 transition-colors text-sm"
        >
          Back to Visualization
        </button>
      </div>
    </div>
  );
};

// Helper function to generate HTML report
function generateHTMLReport(data: any): string {
  // Demo 3D visualization image (base64 encoded placeholder or URL)
  const demoVisualizationImage = `<svg width="600" height="400" xmlns="http://www.w3.org/2000/svg" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px;">
    <rect width="600" height="400" fill="url(#gradient)"/>
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
      </linearGradient>
    </defs>
    <text x="300" y="200" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="white" text-anchor="middle">
      3D VISUALIZATION
    </text>
    <text x="300" y="240" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle">
      ${data.visualization.architectural_style}
    </text>
    <text x="300" y="270" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle">
      Height: ${data.massing_design.height_m}m | FSI: ${data.massing_design.fsi.toFixed(2)} | Units: ${data.tamhil_summary.total_units}
    </text>
  </svg>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CONCEPTA Project Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            color: #333; 
            line-height: 1.6; 
            background: #f5f5f5;
        }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; }
        .header { 
            border-bottom: 3px solid #f59e0b; 
            padding-bottom: 30px; 
            margin-bottom: 40px;
            text-align: center;
        }
        .header h1 { font-size: 32px; color: #1f2937; margin-bottom: 10px; }
        .header p { color: #6b7280; font-size: 14px; }
        .section { margin-bottom: 40px; }
        .section h2 { 
            font-size: 20px; 
            color: #1f2937; 
            margin-bottom: 20px; 
            border-left: 4px solid #f59e0b;
            padding-left: 15px;
        }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px; }
        .card { 
            border: 1px solid #e5e7eb; 
            padding: 20px; 
            border-radius: 8px; 
            background: #f9fafb;
        }
        .card-label { font-size: 12px; color: #9ca3af; text-transform: uppercase; margin-bottom: 8px; }
        .card-value { font-size: 18px; font-weight: bold; color: #f59e0b; }
        .table-row { display: flex; justify-content: space-between; padding: 15px 0; border-bottom: 1px solid #e5e7eb; }
        .table-row:last-child { border-bottom: none; }
        .table-label { color: #6b7280; }
        .table-value { color: #1f2937; font-weight: 500; }
        .visualization-box {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
            background: #f9fafb;
        }
        .visualization-box img,
        .visualization-box svg {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
        }
        .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            text-align: center; 
            color: #9ca3af; 
            font-size: 12px;
        }
        .two-column { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 20px 0; }
        @media print {
            body { background: white; }
            .container { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CONCEPTA</h1>
            <p>AI Architectural Translation Engine - Project Report</p>
        </div>

        <div class="section">
            <h2>Project Information</h2>
            <div class="grid">
                <div class="card">
                    <div class="card-label">Gush</div>
                    <div class="card-value">${data.project_info.gush}</div>
                </div>
                <div class="card">
                    <div class="card-label">Helka</div>
                    <div class="card-value">${data.project_info.helka}</div>
                </div>
                <div class="card">
                    <div class="card-label">Plot Area</div>
                    <div class="card-value">${data.project_info.area_sqm.toLocaleString()} m²</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>3D Visualization</h2>
            <div class="visualization-box">
                ${demoVisualizationImage}
                <p style="margin-top: 15px; color: #6b7280; font-size: 13px;">
                    <strong>Architectural Style:</strong> ${data.visualization.architectural_style}<br>
                    <strong>Primary Material:</strong> ${data.visualization.primary_material}
                </p>
            </div>
        </div>

        <div class="section">
            <h2>Planning Rights</h2>
            <div class="table-row">
                <span class="table-label">Primary Use</span>
                <span class="table-value">${data.planning_rights.primary_use}</span>
            </div>
            <div class="table-row">
                <span class="table-label">Maximum Height</span>
                <span class="table-value">${data.planning_rights.max_height_m} meters</span>
            </div>
            <div class="table-row">
                <span class="table-label">Maximum Floors</span>
                <span class="table-value">${data.planning_rights.max_floors}</span>
            </div>
            <div class="table-row">
                <span class="table-label">Maximum Units</span>
                <span class="table-value">${data.planning_rights.max_units}</span>
            </div>
            <div class="table-row">
                <span class="table-label">Main Area (m²)</span>
                <span class="table-value">${data.planning_rights.main_area_sqm.toLocaleString()}</span>
            </div>
        </div>

        <div class="section">
            <h2>Design Summary</h2>
            <div class="table-row">
                <span class="table-label">Architectural Style</span>
                <span class="table-value">${data.visualization.architectural_style}</span>
            </div>
            <div class="table-row">
                <span class="table-label">Facade Language</span>
                <span class="table-value">${data.visualization.facade_language}</span>
            </div>
            <div class="table-row">
                <span class="table-label">Primary Material</span>
                <span class="table-value">${data.visualization.primary_material}</span>
            </div>
            <div class="table-row">
                <span class="table-label">FSI (Floor Space Index)</span>
                <span class="table-value">${data.massing_design.fsi.toFixed(2)}</span>
            </div>
        </div>

        <div class="section">
            <h2>Massing Details</h2>
            <div class="grid">
                <div class="card">
                    <div class="card-label">Height</div>
                    <div class="card-value">${data.massing_design.height_m} m</div>
                </div>
                <div class="card">
                    <div class="card-label">Coverage</div>
                    <div class="card-value">${data.massing_design.coverage_percent}%</div>
                </div>
                <div class="card">
                    <div class="card-label">Towers</div>
                    <div class="card-value">${data.massing_design.towers}</div>
                </div>
            </div>
            <div class="table-row">
                <span class="table-label">Total Floors</span>
                <span class="table-value">${data.massing_design.total_floors}</span>
            </div>
            <div class="table-row">
                <span class="table-label">Total Units</span>
                <span class="table-value">${data.tamhil_summary.total_units}</span>
            </div>
        </div>

        <div class="footer">
            <p>Report generated on ${new Date().toLocaleString()}</p>
            <p>CONCEPTA © 2024 - All rights reserved</p>
        </div>
    </div>
</body>
</html>
  `;
}

export default ExportReport;
