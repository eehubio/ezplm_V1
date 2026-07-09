#!/usr/bin/env python3
"""
Batch script to add modal functionality to remaining EZPLM pages
This script adds:
1. Modal CSS styles
2. Modal HTML structure
3. JavaScript functions for modal control
"""

# Common modal CSS to be added to all pages
MODAL_CSS = """
        /* Modal样式 */
        .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 2000;
            align-items: center;
            justify-content: center;
        }
        .modal-overlay.active { display: flex; }
        .modal-content {
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 700px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            animation: modalSlideIn 0.3s ease-out;
        }
        @keyframes modalSlideIn {
            from { opacity: 0; transform: translateY(-50px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .modal-header {
            padding: 24px 32px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .modal-title { font-size: 20px; font-weight: 700; color: #3d4647; }
        .modal-close {
            background: none;
            border: none;
            font-size: 28px;
            color: #999;
            cursor: pointer;
            line-height: 1;
            transition: color 0.3s;
        }
        .modal-close:hover { color: #3d4647; }
        .modal-body { padding: 32px; }
        .form-group { margin-bottom: 24px; }
        .form-label {
            display: block;
            font-size: 14px;
            font-weight: 600;
            color: #3d4647;
            margin-bottom: 8px;
        }
        .form-label.required::after { content: ' *'; color: #e74c3c; }
        .form-input, .form-select {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        .form-input:focus, .form-select:focus {
            outline: none;
            border-color: #00890b;
        }
        .form-textarea {
            width: 100%;
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 14px;
            min-height: 80px;
            resize: vertical;
            transition: border-color 0.3s;
        }
        .form-textarea:focus { outline: none; border-color: #00890b; }
        .modal-footer {
            padding: 20px 32px;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }
        .btn-cancel {
            background: white;
            color: #3d4647;
            border: 2px solid #e0e0e0;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        .btn-cancel:hover { border-color: #999; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
"""

print("Modal CSS template ready")
print("This is a reference file for modal implementation patterns")
print("Use the Edit tool to apply modals to each remaining page individually")
