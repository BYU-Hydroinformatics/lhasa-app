from django.shortcuts import render
from tethys_sdk.gizmos import SelectInput, RangeSlider
from tethys_sdk.permissions import login_required
from tethys_sdk.workspaces import app_workspace

import json
import os


@app_workspace
def home(request, app_workspace):
    """
    Controller for the app home page.
    """
    geojson_colors = [('White', '#ffffff'),
                      ('Transparent', 'rgb(0,0,0,0)'),
                      ('Red', '#ff0000'),
                      ('Green', '#00ff00'),
                      ('Blue', '#0000ff'),
                      ('Black', '#000000'),
                      ('Pink', '#ff69b4'),
                      ('Orange', '#ffa500'),
                      ('Teal', '#008080'),
                      ('Purple', '#800080'), ]

    variables = SelectInput(
        display_text='Select a Dataset',
        name='variables',
        multiple=False,
        original=True,
        options=(('GPM IMERG 30 min Precip. Accumulation', '1'),
                 ('GPM IMERG 3 hour Precip. Accumulation', 'CanopInt_inst'),
                 ('GPM IMERG 1 day Precip. Accumulation', 'Qg_tavg'),
                 ('GPM IMERG 3 day Precip. Accumulation', 'ECanop_tavg'),
                 ('GPM IMERG 7 day Precip. Accumulation', 'ESoil_tavg'),
                 ('Global Landslide Nowcast', 'PotEvap_tavg'),
                 ('Global Landslide Nowcast updated every 3 hours', 'Rainf_f_tavg')),
    )

    states_json_file_path = os.path.join(app_workspace.path, 'brazil-states.json')

    options = [('None', 'none')]
    with open(states_json_file_path) as f:
        data = json.load(f)
        features = data.get('features')
        for feature in features:
            newOption = (feature.get('properties').get('name'), feature.get('properties').get('id'))
            options.append(newOption)

    states = SelectInput(
        display_text='Pick A State (ESRI Living Atlas)',
        name='states',
        multiple=False,
        original=True,
        options=tuple(options)
    )

    colorscheme = SelectInput(
        display_text='GLDAS Raster Color Scheme',
        name='colorscheme',
        multiple=False,
        original=True,
        options=(('SST-36', 'sst_36'),
                 ('Greyscale', 'greyscale'),
                 ('Rainbow', 'rainbow'),
                 ('OCCAM', 'occam'),
                 ('OCCAM Pastel', 'occam_pastel-30'),
                 ('Red-Blue', 'redblue'),
                 ('NetCDF Viewer', 'ncview'),
                 ('ALG', 'alg'),
                 ('ALG 2', 'alg2'),
                 ('Ferret', 'ferret'),),
        initial='rainbow'
    )

    opacity = RangeSlider(
        display_text='GLDAS Layer Opacity',
        name='opacity',
        min=.5,
        max=1,
        step=.05,
        initial=1,
    )

    gj_color = SelectInput(
        display_text='Boundary Border Colors',
        name='gjClr',
        multiple=False,
        original=True,
        options=geojson_colors,
        initial='#ffffff'
    )

    gj_opacity = RangeSlider(
        display_text='Boundary Border Opacity',
        name='gjOp',
        min=0,
        max=1,
        step=.1,
        initial=1,
    )

    gj_weight = RangeSlider(
        display_text='Boundary Border Thickness',
        name='gjWt',
        min=1,
        max=5,
        step=1,
        initial=2,
    )

    gj_fillcolor = SelectInput(
        display_text='Boundary Fill Color',
        name='gjFlClr',
        multiple=False,
        original=True,
        options=geojson_colors,
        initial='rgb(0,0,0,0)'
    )

    gj_fillopacity = RangeSlider(
        display_text='Boundary Fill Opacity',
        name='gjFlOp',
        min=0,
        max=1,
        step=.1,
        initial=.5,
    )

    context = {
        # data options
        'variables': variables,
        'states': states,
        # display options
        'colorscheme': colorscheme,
        'opacity': opacity,
        'gjClr': gj_color,
        'gjOp': gj_opacity,
        'gjWt': gj_weight,
        'gjFlClr': gj_fillcolor,
        'gjFlOp': gj_fillopacity,

    }

    return render(request, 'lhasa_app/home.html', context)
