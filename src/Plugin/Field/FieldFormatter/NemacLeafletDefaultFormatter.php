<?php

namespace Drupal\nemac_leaflet\Plugin\Field\FieldFormatter;

use Drupal\Component\Utility\UrlHelper;
use Drupal\Core\Field\Annotation\FieldFormatter;
use Drupal\Core\Annotation\Translation;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\FormatterBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\text\Plugin\Field\FieldFormatter\TextDefaultFormatter;
/**
 * Plugin implementation of the 'nemac_leaflet_default' formatter.
 *
 * @FieldFormatter(
 *   id = "nemac_leaflet_formatter_default",
 *   label = @Translation("NEMAC Leaflet map"),
 *   field_types = {
 *     "geofield",
 *     "text",
 *     "text_long",
 *     "string",
 *     "string_long",
 *   }
 * )
 */
class NemacLeafletDefaultFormatter extends FormatterBase {

  /**
   * {@inheritdoc}
   */
  public static function defaultSettings() {
    return array(
      'nemac_leaflet_map' => 'nemac_leaflet_map',
      'height' => 400,
      'zoom' => 10,
      'minPossibleZoom' => 0,
      'maxPossibleZoom' => 18,
      'minZoom' => 0,
      'maxZoom' => 18,
      'popup' => False,
      'icon' => array(
        'icon_url' => '',
        'shadow_url' => '',
        'icon_size' => array('x' => 0, 'y' => 0),
        'icon_anchor' => array('x' => 0, 'y' => 0),
        'shadow_anchor' => array('x' => 0, 'y' => 0),
        'popup_anchor' => array('x' => 0, 'y' => 0),
      ),
      'base_map_custom' => array(
        'earth' => array(
          'urlTemplate' => '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'options' => array(
            'attribution' => 'Example OSM Map'
          )
        ),
      ),
    ) + parent::defaultSettings();
  }

  /**
   * {@inheritdoc}
   */
  public function settingsForm(array $form, FormStateInterface $form_state) {
    $elements = parent::settingsForm($form, $form_state);

    $base_map = $this->getSetting('base_map_custom');
    $elements['base_map_custom'] = array(
      '#title' => $this->t('Base Map'),
      '#description' => $this->t('These settings will overwrite the default base map.'),
      '#type' => 'fieldset',
      '#collapsible' => TRUE,
      '#collapsed' => empty($base_map),
    );
    $elements['base_map_custom']['earth']['urlTemplate'] = array(
      '#title' => $this->t('URL Template'),
      '#description' => $this->t('URL For Tile Map Layer'),
      '#type' => 'textfield',
      '#maxlength' => 999,
      '#default_value' => $base_map['earth']['urlTemplate'],
    );
    $elements['base_map_custom']['earth']['options']['attribution'] = array(
      '#title' => $this->t('map attribution'),
      '#description' => $this->t('attribution for map source'),
      '#type' => 'textfield',
      '#maxlength' => 999,
      '#default_value' =>  $base_map['earth']['options']['attribution'],
    );


    $options=null;
    for ($i = $this->getSetting('minPossibleZoom'); $i <= $this->getSetting('maxPossibleZoom'); $i++) {
      $options[$i] = $i;
    }
    $elements['zoom'] = array(
      '#title' => $this->t('Zoom'),
      '#type' => 'select',
      '#options' => $options,
      '#default_value' => $this->getSetting('zoom'),
      '#required' => TRUE,
    );
    $elements['minZoom'] = array(
      '#title' => $this->t('Min. Zoom'),
      '#type' => 'select',
      '#options' => $options,
      '#default_value' => $this->getSetting('minZoom'),
      '#required' => TRUE,
    );
    $elements['maxZoom'] = array(
      '#title' => $this->t('Max. Zoom'),
      '#type' => 'select',
      '#options' => $options,
      '#default_value' => $this->getSetting('maxZoom'),
      '#required' => TRUE,
    );
    $elements['height'] = array(
      '#title' => $this->t('Map Height'),
      '#type' => 'number',
      '#default_value' => $this->getSetting('height'),
      '#field_suffix' => $this->t('px'),
    );
    $elements['popup'] = array(
      '#title' => $this->t('Popup'),
      '#description' => $this->t('Show a popup for single location fields.'),
      '#type' => 'checkbox',
      '#default_value' => $this->getSetting('popup'),
    );

    $icon = $this->getSetting('icon');
    $elements['icon'] = array(
      '#title' => $this->t('Map Icon'),
      '#description' => $this->t('These settings will overwrite the icon settings defined in the map definition.'),
      '#type' => 'fieldset',
      '#collapsible' => TRUE,
      '#collapsed' => empty($icon),
    );
    $elements['icon']['icon_url'] = array(
      '#title' => $this->t('Icon URL'),
      '#description' => $this->t('Can be an absolute or relative URL.'),
      '#type' => 'textfield',
      '#maxlength' => 999,
      '#default_value' => $icon['icon_url'],
      '#element_validate' => array(array($this, 'validateUrl')),
    );
    $elements['icon']['shadow_url'] = array(
      '#title' => $this->t('Icon Shadow URL'),
      '#type' => 'textfield',
      '#maxlength' => 999,
      '#default_value' => $icon['shadow_url'],
      '#element_validate' => array(array($this, 'validateUrl')),
    );

    $elements['icon']['icon_size'] = array(
      '#title' => $this->t('Icon Size'),
      '#type' => 'fieldset',
      '#collapsible' => FALSE,
      '#description' => $this->t('Size of the icon image in pixels.')
    );
    $elements['icon']['icon_size']['x'] = array(
      '#title' => $this->t('Width'),
      '#type' => 'number',
      '#default_value' => $icon['icon_size']['x'],
    );
    $elements['icon']['icon_size']['y'] = array(
      '#title' => $this->t('Height'),
      '#type' => 'number',
      '#default_value' => $icon['icon_size']['y'],
    );
    $elements['icon']['icon_anchor'] = array(
      '#title' => $this->t('Icon Anchor'),
      '#type' => 'fieldset',
      '#collapsible' => FALSE,
      '#description' => $this->t('The coordinates of the "tip" of the icon (relative to
        its top left corner). The icon will be aligned so that this point is at the marker\'s geographical location.')
    );
    $elements['icon']['icon_anchor']['x'] = array(
      '#title' => $this->t('X'),
      '#type' => 'number',
      '#default_value' => $icon['icon_anchor']['x'],
    );
    $elements['icon']['icon_anchor']['y'] = array(
      '#title' => $this->t('Y'),
      '#type' => 'number',
      '#default_value' => $icon['icon_anchor']['y'],
    );
    $elements['icon']['shadow_anchor'] = array(
      '#title' => $this->t('Shadow Anchor'),
      '#type' => 'fieldset',
      '#collapsible' => FALSE,
      '#description' => $this->t('The point from which the shadow is shown.')
    );
    $elements['icon']['shadow_anchor']['x'] = array(
      '#title' => $this->t('X'),
      '#type' => 'number',
      '#default_value' => $icon['shadow_anchor']['x'],
    );
    $elements['icon']['shadow_anchor']['y'] = array(
      '#title' => $this->t('Y'),
      '#type' => 'number',
      '#default_value' => $icon['shadow_anchor']['y'],
    );
    $elements['icon']['popup_anchor'] = array(
      '#title' => $this->t('Popup Anchor'),
      '#type' => 'fieldset',
      '#collapsible' => FALSE,
      '#description' => $this->t('The point from which the marker popup opens, relative
        to the anchor point.')
    );
    $elements['icon']['popup_anchor']['x'] = array(
      '#title' => $this->t('X'),
      '#type' => 'number',
      '#default_value' => $icon['popup_anchor']['x'],
    );
    $elements['icon']['popup_anchor']['y'] = array(
      '#title' => $this->t('Y'),
      '#type' => 'number',
      '#default_value' => $icon['popup_anchor']['y'],
    );


    return $elements;
  }

  /**
   * {@inheritdoc}
   */
  public function settingsSummary() {
    $summary = array();
    $summary[] = $this->t('NEMAC Leaflet map: @map', array('@map' => $this->getSetting('nemac_leaflet_map')));
    $summary[] = $this->t('Map height: @height px', array('@height' => $this->getSetting('height')));
    return $summary;
  }

  /**
   * {@inheritdoc}
   *
   * This function is called from parent::view().
   */
  public function viewElements(FieldItemListInterface $items, $langcode) {
    $settings = $this->getSettings();
    $icon_url = $settings['icon']['icon_url'];

    $map = nemac_leaflet_map_get_info($settings['nemac_leaflet_map']);
    $map['settings']['zoom'] = isset($settings['zoom']) ? $settings['zoom'] : null;
    $map['settings']['minZoom'] = isset($settings['minZoom']) ? $settings['minZoom'] : null;
    $map['settings']['maxZoom'] = isset($settings['zoom']) ? $settings['maxZoom'] : null;
    $map['settings']['base_map_custom'] = isset($settings['base_map_custom']) ? $settings['base_map_custom'] : null;

    $elements = array();
    foreach ($items as $delta => $item) {

      $features = nemac_leaflet_process_geofield($item->value);

      // If only a single feature, set the popup content to the entity title.
      if ($settings['popup'] && count($items) == 1) {
        $features[0]['popup'] = $items->getEntity()->label();
      }
      if (!empty($icon_url)) {
        foreach ($features as $key => $feature) {
          $features[$key]['icon'] = $settings['icon'];
        }
      }
      $elements[$delta] = nemac_leaflet_render_map($map, $features, $settings['height'] . 'px');
    }

    return $elements;
  }

  public function validateUrl($element, FormStateInterface $form_state) {
    if (!empty($element['#value']) && !UrlHelper::isValid($element['#value'])) {
      $form_state->setError($element, $this->t("Icon Url is not valid."));
    }
  }

}
