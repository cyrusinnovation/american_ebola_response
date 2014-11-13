require 'csv'
require 'date'
require_relative 'country_data'
require_relative 'outbreak_data'

class EbolaData
	attr_accessor :countries, :sorted_names, :daily_data_dates

	def initialize()
		@countries = {}
		@dates = {}
		@daily_data_dates = nil
	end

	def country_data_for(country_code)
		@countries[country_code]
	end

	def dates
		@dates.keys.sort
	end

	def dates_hash(dates_array)
		dates_array.inject({}) { |memo, date| memo[date] = true; memo }
	end

	def add_country(country_data)
		setup_dates(country_data)
		merge_in_country_data(country_data)
	end

	def merge_in_country_data(country_data)
		if (@countries.has_key?(country_data.name))
			@countries[country_data.name].merge_data(country_data)
		else
			@countries[country_data.name] = country_data
		end
	end

	def line(date)
		[date] + @sorted_countries.map { |country_name| countries[country_name].data_for(date) }
	end

	def header
		['Date'] + @sorted_countries
	end

	def normalize_data
		@countries.values.each { |country_data| country_data.normalize_data }
	end

	def write_csv(outbreak_data)
		# @countries['430'].data.each_with_index do |data, index|
		# 	puts "#{@countries['430'].dates[index]}: #{index} #{data}"
		# end
		# @countries['328'].data.each_with_index do |data, index|
		# 	puts "#{@countries['328'].dates[index]}: #{index} #{data}"
		# end

		@sorted_countries = countries.keys.sort
		CSV.open("outputs/ebola_results.csv", 'w') do |writer|
			writer << header
			outbreak_data.dates.each do |date|
				writer << line(date)
			end
		end
	end

	private

	def setup_dates(country_data)
		if (@dates.empty?)
			@dates = dates_hash(country_data.dates)
		else
			@dates.merge!(dates_hash(country_data.dates))
		end
		raise "bad data for #{country_data.name}" if dates.include? nil

		setup_daily_dates(country_data)
	end

	def setup_daily_dates(country_data)
		return if @daily_data_dates && (@daily_data_dates.size >= 95)
		return if @daily_data_dates && (country_data.data.size == 90)

		date_hash = {}
		date_hash = Hash[@daily_data_dates.map { |v| [v, v] }] if @daily_data_dates

		if (country_data.data.size == 90 || country_data.data.size <= 30)
			date_hash = country_data.dates.each_with_index.inject(date_hash) do |memo, (date, index)|
				memo[date] = date unless country_data.data[index][0].nil?
				memo
			end

			@daily_data_dates = date_hash.keys.sort;
		end
	end
end
